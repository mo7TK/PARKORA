"""
spot_picker.py — Step 1: Define your parking spots
────────────────────────────────────────────────────
Run this on the reference.jpg image produced by extract_frame.py.
Click exactly 4 corners of each parking spot to define it as a polygon.

Why polygons instead of rectangles?
  Real parking spots are often at an angle. A polygon with 4 clicked
  corners fits any orientation precisely, while a rectangle would
  either miss part of the spot or include too much of the neighbor.

Controls:
  Left click     → add a corner point (4 per spot)
  ENTER / SPACE  → confirm current spot and start the next one
  Z              → undo last point
  D              → delete last completed spot
  S              → save all spots to parking_spots.json and exit
  Q / ESC        → quit without saving

Output:
  parking_spots.json  — list of polygons, each as [[x1,y1],[x2,y2],[x3,y3],[x4,y4]]
"""

import cv2
import json
import sys
import os
import numpy as np


# Each completed spot gets a different color so they're easy to distinguish
COLORS = [
    (52, 235, 143),   # green
    (52, 180, 235),   # blue
    (235, 180, 52),   # orange
    (235, 52, 180),   # pink
    (180, 52, 235),   # purple
    (235, 235, 52),   # yellow
]
POINT_RADIUS   = 6
LINE_THICKNESS = 2
FONT           = cv2.FONT_HERSHEY_SIMPLEX


def draw_state(frame, spots, current_points):
    """
    Render all completed spots (filled polygons) and the
    in-progress polygon (yellow dots + lines) onto a copy of the frame.
    """
    overlay = frame.copy()

    # Draw all confirmed spots with a semi-transparent fill
    for i, spot in enumerate(spots):
        pts   = np.array(spot, dtype=np.int32)
        color = COLORS[i % len(COLORS)]
        # fillPoly needs BGR so we reverse the RGB color tuple
        cv2.fillPoly(overlay, [pts], color[::-1])
        cv2.polylines(overlay, [pts], True, color[::-1], LINE_THICKNESS)
        # Spot number label at the center
        cx = int(np.mean(pts[:, 0]))
        cy = int(np.mean(pts[:, 1]))
        cv2.putText(overlay, f"#{i+1}", (cx - 10, cy + 6),
                    FONT, 0.55, (255, 255, 255), 2, cv2.LINE_AA)

    # Blend the filled overlay with the original frame (40% fill opacity)
    out = cv2.addWeighted(overlay, 0.40, frame, 0.60, 0)

    # Draw the in-progress polygon in yellow
    if current_points:
        for j, pt in enumerate(current_points):
            cv2.circle(out, pt, POINT_RADIUS, (0, 255, 255), -1)
            if j > 0:
                cv2.line(out, current_points[j - 1], pt, (0, 255, 255), LINE_THICKNESS)
        # Show a faint closing line back to the first point
        if len(current_points) > 1:
            cv2.line(out, current_points[-1], current_points[0], (0, 255, 255), 1)

    # HUD — instructions shown at the top of the window
    pts_remaining = max(0, 4 - len(current_points))
    hud_lines = [
        f"Spots defined: {len(spots)}",
        f"Click {pts_remaining} more point(s)  [4 per spot]"
        if pts_remaining > 0 else "ENTER or SPACE = confirm spot",
        "Z = undo last point   D = delete last spot",
        "S = save & exit       Q = quit without saving",
    ]
    for k, line in enumerate(hud_lines):
        y = 28 + k * 26
        # Black outline first for readability on any background
        cv2.putText(out, line, (10, y), FONT, 0.58, (0, 0, 0),   3, cv2.LINE_AA)
        cv2.putText(out, line, (10, y), FONT, 0.58, (255, 255, 255), 1, cv2.LINE_AA)

    return out


def mouse_callback(event, x, y, flags, state):
    """Called by OpenCV on every mouse event inside the window."""
    if event == cv2.EVENT_LBUTTONDOWN:
        state["current"].append((x, y))
        state["dirty"] = True


def main():
    # ── Resolve image path ──────────────────────────────────────────────────
    if len(sys.argv) > 1:
        img_path = sys.argv[1]
    else:
        # If no argument given, look for the default output of extract_frame.py
        for candidate in ["reference.jpg", "reference.png", "frame.jpg"]:
            if os.path.exists(candidate):
                img_path = candidate
                break
        else:
            print("Usage: python spot_picker.py <image_path>")
            print("  e.g. python spot_picker.py reference.jpg")
            print("  Run extract_frame.py first to generate reference.jpg")
            sys.exit(1)

    frame = cv2.imread(img_path)
    if frame is None:
        print(f"[ERROR] Could not load image: {img_path}")
        sys.exit(1)

    h, w = frame.shape[:2]
    print(f"[INFO] Loaded {img_path}  ({w}×{h})")
    print("[INFO] Click 4 corners per parking spot, then press ENTER to confirm.")

    spots = []
    state = {"current": [], "dirty": True}

    cv2.namedWindow("Spot Picker", cv2.WINDOW_NORMAL)
    cv2.resizeWindow("Spot Picker", min(w, 1280), min(h, 720))
    cv2.setMouseCallback("Spot Picker", mouse_callback, state)

    while True:
        if state["dirty"]:
            vis = draw_state(frame.copy(), spots, state["current"])
            cv2.imshow("Spot Picker", vis)
            state["dirty"] = False

        key = cv2.waitKey(20) & 0xFF

        # ENTER or SPACE — confirm the current spot
        if key in (13, 32):
            if len(state["current"]) >= 3:
                spots.append(state["current"].copy())
                print(f"  Spot #{len(spots)} confirmed with {len(state['current'])} points.")
                state["current"] = []
                state["dirty"]   = True
            else:
                print("[WARN] Need at least 3 points to confirm a spot.")

        # Z — undo the last clicked point
        elif key == ord("z"):
            if state["current"]:
                state["current"].pop()
                state["dirty"] = True

        # D — delete the last completed spot
        elif key == ord("d"):
            if spots:
                spots.pop()
                print(f"  Last spot deleted. {len(spots)} spots remaining.")
                state["dirty"] = True

        # S — save all spots to JSON and exit
        elif key == ord("s"):
            if not spots:
                print("[WARN] No spots to save yet!")
            else:
                out_path = "spots.json"
                with open(out_path, "w") as f:
                    json.dump(spots, f, indent=2)
                print(f"\n[SAVED] {len(spots)} spots → {out_path}")
                print("[NEXT]  Run: python detector.py")
                break

        # Q or ESC — quit without saving
        elif key in (ord("q"), 27):
            print("[INFO] Quit without saving.")
            break

    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()