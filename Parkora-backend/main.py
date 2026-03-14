"""
main.py — FastAPI backend for the parking detection prototype
─────────────────────────────────────────────────────────────
Two endpoints:

  POST /update
    Called by parking_detector.py every second.
    Receives the current status of all spots and broadcasts
    it to every connected mobile app via WebSocket.

  WebSocket /ws
    The React Native app connects here and stays connected.
    It receives a message every time the spot statuses change.

Usage:
  uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import List
import asyncio

app = FastAPI()


# ── In-memory state ──────────────────────────────────────────────────────────
# This holds the latest spot statuses received from the detector.
# It is just a Python list in memory — no database needed for the prototype.
# True  = occupied
# False = free
latest_spots: List[bool] = []


# ── Connected WebSocket clients ───────────────────────────────────────────────
# Every time a mobile app connects via WebSocket, we add it to this list.
# When new data arrives we loop through the list and send to all of them.
connected_clients: List[WebSocket] = []


# ── Data model for POST /update ───────────────────────────────────────────────
# Pydantic validates the incoming JSON automatically.
# The detector sends: {"spots": [true, false, true, ...]}
class SpotsUpdate(BaseModel):
    spots: List[bool]


# ── POST /update ──────────────────────────────────────────────────────────────
@app.post("/update")
async def update_spots(data: SpotsUpdate):
    """
    Receives spot statuses from parking_detector.py.
    Saves them in memory and broadcasts to all connected WebSocket clients.
    """
    global latest_spots
    latest_spots = data.spots

    # Build the message we will send to the mobile app.
    # We count free/occupied here so the app doesn't have to.
    free_count     = data.spots.count(False)
    occupied_count = data.spots.count(True)

    message = {
        "spots":    data.spots,
        "free":     free_count,
        "occupied": occupied_count,
        "total":    len(data.spots),
    }

    # Broadcast to every connected client
    # We iterate over a copy of the list in case a client disconnects mid-loop
    for client in connected_clients.copy():
        try:
            await client.send_json(message)
        except Exception:
            # Client disconnected — remove it from the list
            connected_clients.remove(client)

    return {"status": "ok", "clients_notified": len(connected_clients)}


# ── WebSocket /ws ─────────────────────────────────────────────────────────────
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    The mobile app connects here and stays connected.
    When the connection opens we immediately send the latest known state
    so the app doesn't show an empty screen while waiting for the first update.
    """
    await websocket.accept()
    connected_clients.append(websocket)
    print(f"[WS] Client connected. Total connected: {len(connected_clients)}")

    # Send current state immediately on connect
    if latest_spots:
        await websocket.send_json({
            "spots":    latest_spots,
            "free":     latest_spots.count(False),
            "occupied": latest_spots.count(True),
            "total":    len(latest_spots),
        })

    try:
        # Keep the connection alive by waiting for messages.
        # The app doesn't need to send anything — we just need to detect
        # when it disconnects (WebSocketDisconnect exception below).
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        connected_clients.remove(websocket)
        print(f"[WS] Client disconnected. Total connected: {len(connected_clients)}")
