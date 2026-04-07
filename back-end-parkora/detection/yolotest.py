from ultralytics import YOLO

model = YOLO("yolov8n.pt")


results = model(source= "http://192.168.1.36:4747/video" , show=True, stream=True)

for result in results:
    pass  # Keep the loop running to display the video feed