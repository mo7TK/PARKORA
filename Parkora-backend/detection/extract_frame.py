"""
extract_frame.py — grab a single frame from your video to use with spot_picker.py

Why this exists:
  spot_picker.py works on a static image, not a live video.
  This script pulls one frame out of your video and saves it as reference.jpg.
  You then run spot_picker.py on that image to define your parking spots.

Usage:
  python extract_frame.py
"""

import cv2
import sys

# ─────────────────────────────────────────────
# ADJUST THIS: path to your video file
VIDEO_PATH = "../parking.mp4"

# ADJUST THIS: which second of the video to extract
# Pick a moment where all parking spots are clearly visible
EXTRACT_AT_SECOND = 5.0

# ADJUST THIS: output image filename
OUTPUT_IMAGE = "reference.jpg"
# ─────────────────────────────────────────────


def main():
    cap = cv2.VideoCapture(VIDEO_PATH)
    if not cap.isOpened():
        print(f"[ERROR] Cannot open: {VIDEO_PATH}")
        sys.exit(1)

    fps   = cap.get(cv2.CAP_PROP_FPS) or 25
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f"[INFO] Video opened — {total} frames at {fps:.1f} fps")

    target = int(EXTRACT_AT_SECOND * fps)
    target = min(target, total - 1)

    cap.set(cv2.CAP_PROP_POS_FRAMES, target)
    ret, frame = cap.read()
    cap.release()

    if not ret:
        print("[ERROR] Could not read frame.")
        sys.exit(1)

    cv2.imwrite(OUTPUT_IMAGE, frame)
    print(f"[SAVED] Frame {target} ({target / fps:.1f}s) → {OUTPUT_IMAGE}")
    print(f"[NEXT]  Run: python spot_picker.py {OUTPUT_IMAGE}")


if __name__ == "__main__":
    main()
