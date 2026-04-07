import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from socket_manager import manager

router = APIRouter()

# ── In-memory state ───────────────────────────────────────────────────────────
# Holds the latest statuses received from detect.py
# Format: { "spots": [{"id": 1, "status": "free"}, ...] }
latest_state: dict = {"spots": []}
# ─────────────────────────────────────────────────────────────────────────────


class SpotStatus(BaseModel):
    id: int
    status: str  # "free" or "occupied"


class SpotsUpdate(BaseModel):
    spots: list[SpotStatus]


@router.get("/spots-summary")
def spots_summary():
    """
    Called by the details screen on load.
    Returns a simple count — no WebSocket needed for this.
    """
    spots    = latest_state["spots"]
    free     = sum(1 for s in spots if s["status"] == "free")
    occupied = sum(1 for s in spots if s["status"] == "occupied")
    return {
        "total":    len(spots),
        "free":     free,
        "occupied": occupied,
    }


@router.post("/update-spots")
async def update_spots(data: SpotsUpdate):
    global latest_state
    latest_state = {"spots": [spot.dict() for spot in data.spots]}
    await manager.broadcast(json.dumps(latest_state))
    return {
        "received":         len(data.spots),
        "clients_notified": len(manager.active_connections),
    }


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)

    if latest_state["spots"]:
        await websocket.send_text(json.dumps(latest_state))

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
