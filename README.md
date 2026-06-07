# RoadSense

This project is all about making two-wheeler riding safer using real-time event detection.

Essentially, we combine hardware sensors on the bike with machine learning to identify hazards like potholes, bumps, overspeeding, and harsh braking. The whole setup uses a Raspberry Pi wired to an MPU6500 (accelerometer/gyroscope), a GPS module, and a Pi Camera. Data gets crunched on the edge and pushed to a Firebase cloud backend, which then updates a live flutter dashboard app and a web dashboard.

## Project Layout

- **Code/Hardware Source Codes/**: This is where all the Python scripts running on the Raspberry Pi live. Things like `main2.py` (which orchestrates the sensors) and utils for the GPS, camera, and IMU.
- **Code/Warning Generation Algorithm/**: The brains of the operation. We have an LSTM model that uses the IMU data to detect maneuvers, and a Roboflow-based computer vision script (`live_detect.py`) for spotting potholes and bumps.
- **Code/Dashboard/**: A web dashboard (React/Vite).
- **Code/Live_Dashboard/**: A Flutter app that riders can run on their phone.
- **Demos/** & **Report/**: Videos and documentation going over how the whole thing works.

If you're trying to run this, check out the `Code/README.md` for more technical instructions on setting up the environments and using the makefile.
