// ── Backend ───────────────────────────────────────────────────────────────────
// Replace with your computer's local IP (run `ipconfig` on Windows)
export const BACKEND_IP = "192.168.1.38";
export const BACKEND_URL = `http://${BACKEND_IP}:8000`;
export const WS_URL = `ws://${BACKEND_IP}:8000/ws`;

// ── Parking lot ─────────────────────────────────────────────────────────────
export const PARKING_LOT = {
  id: 1,
  name: "Parking Universitaire",
  totalSpots: 14,
  latitude: 36.75000775277104,
  longitude: 5.039663538251243,
};
