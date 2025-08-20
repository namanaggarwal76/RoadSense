# Two-Wheeler Event Detection System - Code Documentation

A comprehensive system for real-time two-wheeler event detection, warning generation, and road hazard identification using sensor fusion (GPS, MPU6500, Camera) with LSTM-based inference and Firebase cloud integration.

## README for both Dashboard and Live_Dashboard/ are in respective directories

---

## Project Structure

```bash
Code/
├── makefile                          # Build automation and run commands
├── README.md                         # This documentation file
├── Hardware Source Codes/            # Sensor interfacing and data acquisition
│   ├── main2.py                      # Main data acquisition orchestrator
│   ├── camera_utils.py               # Pi Camera capture utilities
│   ├── gps_utils.py                  # GPS serial communication and parsing
│   ├── mpu_utils.py                  # MPU6500 accelerometer/gyroscope driver
│   ├── firebase_uploader.py          # Firebase Realtime Database integration
│   ├── shared_memory_bridge.py       # IPC for high-speed data transfer
│   ├── speed_limit_utils.py          # OLA Maps API speed limit fetching
│   ├── performance_monitor.py        # Loop timing and profiling utilities
│   ├── gps_team_2_code.py            # Alternative GPS implementation
│   ├── quick_gps_check.py            # GPS connectivity testing
│   ├── test_gps.py                   # GPS unit tests
│   ├── verify_timing.py              # Timing verification utility
│   └── Old_Source_Codes/             # Legacy/deprecated implementations
│       ├── capture_video.py
│       ├── gps.py
│       ├── ldr.py
│       ├── lidar.py
│       └── mpu6500.py
├──  Warning Generation Algorithm/    # ML inference and warning system
│   ├── Warning_Generate.py           # Warning detection and Firebase push
│   ├── live_detect.py                # Real-time pothole/bump camera detection
│   ├── live_detect_old.py            # Legacy camera detection
│   └── lstm_model_weights_with_class_weights89.weights.h5  # Pre-trained LSTM model
├── Dashbaord/    
└── Live_Dashboard/   
```

---

## 🔧 Hardware Source Codes

### **main2.py** - Main Orchestrator

The central data acquisition script that coordinates all sensors and manages ride sessions.

**Features:**

- 104 Hz sensor data sampling from MPU6500
- GPS data acquisition with accelerometer-based speed fallback
- Speed limit fetching via OLA Maps API
- CSV data logging with ride-specific filenames
- Shared memory communication with Warning_Generate.py
- Firebase ride control (start/stop via mobile app)
- Multi-threaded architecture for parallel sensor reading

**Key Parameters:**

- `TARGET_HZ = 104` - Sampling frequency
- `SPEED_LIMIT_REFRESH_S = 50.0` - Speed limit API refresh interval
- `FIREBASE_PUSH_INTERVAL_S = 7.0` - Firebase update interval

---

### **camera_utils.py** - Camera Interface

Handles Raspberry Pi camera initialization and image capture.

**Functions:**

- `init_camera(resolution, save_dir)` - Initialize Pi Camera with given resolution
- `capture_image(camera_manager)` - Capture and save timestamped JPEG images
- `close(camera_manager)` - Clean up camera resources

---

### **gps_utils.py** - GPS Module Interface

Serial communication with GPS module using NMEA protocol.

**Functions:**

- `init_gps(port, baud)` - Initialize GPS serial connection (default: `/dev/serial0`, 9600 baud)
- `get_gps_data(gps_serial)` - Parse GPRMC sentences for lat, lon, speed
- `init_gps_with_recovery()` - Auto-recovery on connection failures
- `test_gps_connection()` - Diagnostic function for GPS debugging

**Output:** Tuple of `(latitude, longitude, speed_kmh)`

---

### **mpu_utils.py** - IMU Sensor Driver

MPU6500 accelerometer and gyroscope driver with Kalman filtering.

**Functions:**

- `init_mpu()` - Initialize sensor and perform 1-second calibration
- `get_mpu_data()` - Get filtered, bias-corrected sensor readings
- `calibrate_mpu()` - Calculate zero-error bias for accuracy

**Output:** Tuple of `(acc_x, acc_y, acc_z, gyro_x, gyro_y, gyro_z)` in g and rad/s

---

### **firebase_uploader.py** - Cloud Integration

Firebase Realtime Database client for ride data synchronization.

**Functions:**

- `init_auth()` - Authenticate with Firebase using email/password
- `update_rider_speed()` - Push speed, warnings, and LSTM predictions
- `get_control_flags_for_ride()` - Poll ride start/stop status
- `get_next_ride_id()` - Get next available ride identifier
- `upload_raw_data_to_firebase()` - Upload CSV data after ride ends

---

### **shared_memory_bridge.py** - Inter-Process Communication

Zero-copy shared memory for transferring sensor batches between processes.

**Classes:**

- `SensorDataWriter` - Used by main2.py to write 104-point batches
- `SensorDataReader` - Used by Warning_Generate.py to read batches

**Data Format:** 104 points × 11 fields (timestamp, acc_xyz, gyro_xyz, lat, lon, speed, speed_limit)

---

### **speed_limit_utils.py** - Speed Limit API

Fetches road speed limits using OLA Maps Routing API.

**Function:**

- `get_speed_limit(lat, lon, api_key)` - Returns speed limit in km/h for given coordinates

---

### **performance_monitor.py** - Profiling Tools

Diagnostic utilities for measuring loop performance.

**Classes:**

- `LoopTimer` - Measures loop frequency and timing statistics
- `SectionTimer` - Profiles time spent in code sections

---

## Warning Generation Algorithm

### **Warning_Generate.py** - Warning Detection System

Main warning detection engine using LSTM model and rule-based analysis.

**Detection Types:**

| Index | Warning Type | Detection Method |
|-------|--------------|------------------|
| 0 | Overspeeding | Speed > Speed Limit |
| 1 | Bump | Camera detection (live_detect.py) |
| 2 | Pothole | Camera detection (live_detect.py) |
| 3 | Speedy Turns | LSTM (LEFT/RIGHT) + Angular velocity > threshold |
| 4 | Harsh Braking | Acceleration slope analysis |
| 5 | Sudden Acceleration | Acceleration jerk detection |

**LSTM Model:**

- Input: 104 timesteps × 6 features (acc_xyz, gyro_xyz)
- Output: 5 classes (BUMP, LEFT, RIGHT, STOP, STRAIGHT)
- Weights: `lstm_model_weights_with_class_weights89.weights.h5`

---

### **live_detect.py** - Camera-Based Hazard Detection

Real-time pothole and speed bump detection using computer vision.

**Model:** Roboflow inference model for road hazard detection
**Output:** JSON file (`camera_warnings.json`) with detection state

---

## How to Run

### Prerequisites

1. **Hardware:**
   - Raspberry Pi (tested on Pi 4)
   - MPU6500 IMU sensor (I2C)
   - GPS module (UART on `/dev/serial0`)
   - Pi Camera module

2. **Software:**
   - Python 3.8+
   - Two virtual environments:
     - `my_env` - For main2.py and Warning_Generate.py
     - `.venv` - For live_detect.py (separate due to TensorFlow/inference dependencies)

3. **Install Dependencies:**

   ```bash
   # For my_env
   pip install numpy smbus2 pyserial requests tensorflow keras h5py

   # For .venv
   pip install supervision inference picamera2 opencv-python
   ```

4. **Configure Virtual Environment Paths:**
   Edit the `makefile` to set correct paths:

   ```makefile
   MY_ENV=~/Desktop/Two-Wheeler-Event-Detection/my_env
   VENV=~/Desktop/Two-Wheeler-Event-Detection/.venv
   ```

---

### Running the System

#### Option 1: Using Makefile (Recommended)

```bash
cd Code/
make run
```

This command:

1. Fixes GPS port permissions (`/dev/ttyS0`)
2. Starts `main2.py` (sensor data acquisition)
3. Starts `Warning_Generate.py` (warning detection)
4. Starts `live_detect.py` (camera detection)

#### Option 2: Manual Execution

**Terminal 1 - Data Acquisition:**

```bash
source ~/Desktop/Two-Wheeler-Event-Detection/my_env/bin/activate
sudo chmod 666 /dev/ttyS0
cd "Code/Hardware Source Codes/"
python main2.py
```

**Terminal 2 - Warning Generation:**

```bash
source ~/Desktop/Two-Wheeler-Event-Detection/my_env/bin/activate
cd "Code/Warning Generation Algorithm/"
python Warning_Generate.py
```

**Terminal 3 - Camera Detection:**

```bash
source ~/Desktop/Two-Wheeler-Event-Detection/.venv/bin/activate
cd "Code/Warning Generation Algorithm/"
python live_detect.py
```

---

### System Flow

```
┌──────────────────┐     ┌─────────────────────┐     ┌──────────────────┐
│    main2.py      │────▶│ Shared Memory Bridge│────▶│ Warning_Generate │
│                  │     │  (104 points/batch) │     │      .py         │
│  • MPU6500 @104Hz│     └─────────────────────┘     │                  │
│  • GPS @1Hz      │                                 │  • LSTM Inference│
│  • Speed Limit   │                                 │  • Rule-based    │
│  • CSV Logging   │                                 │  • Firebase Push │
└──────────────────┘                                 └──────────────────┘
                                                              │
┌──────────────────┐     ┌─────────────────────┐              │
│  live_detect.py  │────▶│ camera_warnings.json│──────────────┘
│                  │     └─────────────────────┘
│  • Pothole Det.  │
│  • Bump Detection│
└──────────────────┘
```

---

### Output Files

| File | Description |
|------|-------------|
| `rawdata_{ride_id}.csv` | Raw sensor data (104 Hz) |
| `warnings_{ride_id}.csv` | Sensor data + LSTM predictions + warnings |
| `camera_warnings.json` | Real-time camera detection state |
| `captured_images/` | Timestamped camera frames |

---

---

## Notes

- The system waits for Firebase `is_active` flag to be set `True` before starting data collection
- GPS speed is used when available; accelerometer integration is used as fallback
- MPU6500 is calibrated at startup - keep the sensor still for 1 second
- Shared memory enables sub-millisecond data transfer between processes
- LSTM model expects exactly 104 data points per inference batch
