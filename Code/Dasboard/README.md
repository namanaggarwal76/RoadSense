# 🚗 GeoDriver - Fleet Management Dashboard

A real-time fleet management dashboard for monitoring two-wheeler ride data with GPS tracking, speed analysis, and acceleration monitoring. Built for the **Wheeler Event Detection** project.

[Live Link](https://geo-driver-qmbzvaagu-namanaggarwal76s-projects.vercel.app/)


![React](https://img.shields.io/badge/React-18.3.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)
![Firebase](https://img.shields.io/badge/Firebase-12.2.1-orange)
![Vite](https://img.shields.io/badge/Vite-5.4.19-purple)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-green)

## 🎯 Overview

GeoDriver is a read-only dashboard application designed to visualize and analyze two-wheeler ride data collected from IoT sensors. The application provides real-time monitoring of:

- **GPS Route Tracking** - Interactive maps showing complete ride paths
- **Speed Analysis** - Speed vs time graphs with violation detection
- **Acceleration Monitoring** - G-force analysis for hard braking, acceleration, and sharp turns
- **Fleet Management** - Multi-user and multi-ride support

## ✨ Features

### 🗺️ Interactive Map View
- **Leaflet Integration** with OpenStreetMap tiles (free, no API key required)
- Real-time GPS route visualization with polylines
- Start and end point markers
- Speed violation markers with detailed popups
- Auto-zoom to fit entire route
- Pan and zoom controls

### 📊 Speed Chart
- Speed vs sample index visualization
- Speed limit overlay with highlighted violations
- Real-time violation counter
- Max speed display
- Interactive tooltips with time and speed details

### 📈 Acceleration Chart
- 3-axis acceleration data (X, Y, Z) converted to m/s²
- Hard acceleration detection (>3 m/s²)
- Hard braking detection (<-2 m/s²)
- Sharp turn detection (lateral acceleration >2 m/s²)
- Event counters and markers

### 👥 Fleet Management
- Multi-user support
- Multiple rides per user
- Real-time data synchronization
- Firebase Realtime Database integration

## 🛠️ Tech Stack

### Frontend Framework
- **React 18.3.1** - UI library
- **TypeScript 5.8.3** - Type safety
- **Vite 5.4.19** - Build tool and dev server

### UI Components
- **shadcn/ui** - Component library based on Radix UI
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **Lucide React** - Icon library
- **Recharts 2.15.4** - Charting library

### Mapping
- **Leaflet 1.9.4** - Interactive maps
- **React-Leaflet 4.2.1** - React wrapper for Leaflet
- **OpenStreetMap** - Free tile provider

### Backend
- **Firebase 12.2.1** - Realtime Database
- **Firebase Realtime Database** - Data storage and sync

### Development Tools
- **ESLint** - Code linting
- **TypeScript ESLint** - TypeScript-specific linting
- **PostCSS & Autoprefixer** - CSS processing

## 📁 Project Structure

```
geo-driver/
├── public/
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── AccelerationChart.tsx    # Acceleration visualization
│   │   │   ├── MapView.tsx              # GPS map with Leaflet
│   │   │   ├── Sidebar.tsx              # User/ride selector
│   │   │   ├── SpeedChart.tsx           # Speed analysis
│   │   │   └── WarningsList.tsx         # Violations list
│   │   └── ui/                          # shadcn/ui components
│   ├── config/
│   │   └── firebaseConfig.js            # Firebase initialization
│   ├── contexts/
│   │   └── FleetContext.tsx             # Global state management
│   ├── hooks/
│   │   ├── use-mobile.tsx               # Responsive utilities
│   │   └── use-toast.ts                 # Toast notifications
│   ├── lib/
│   │   └── utils.ts                     # Utility functions
│   ├── pages/
│   │   ├── Index.tsx                    # Main dashboard page
│   │   └── NotFound.tsx                 # 404 page
│   ├── services/
│   │   └── firebaseApi.ts               # Firebase API abstraction
│   ├── utils/                           # Utility modules
│   ├── App.tsx                          # Root component
│   ├── main.tsx                         # Application entry point
│   └── index.css                        # Global styles
├── MAP_INTEGRATION.md                   # Map integration docs
├── package.json                         # Dependencies
├── tsconfig.json                        # TypeScript config
├── vite.config.ts                       # Vite config
├── tailwind.config.ts                   # Tailwind config
└── components.json                      # shadcn/ui config
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **npm** or **yarn** package manager
- **Firebase Project** with Realtime Database

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Open in browser**
   
   Navigate to `http://localhost:8080`

## 🗄️ Firebase Data Schema

The application follows this Firebase Realtime Database structure:

```json
{
  "users": {
    "{user_id}": {
      "rides": {
        "{ride_id}": {
          "rider_control": {
            "ride_status": {
              "is_active": true,
              "start_timestamp": 1633024800000,
              "calculate_model": true
            }
          },
          "raw_data": [
            {
              "timestamp": "2025-10-03 14:25:30.123",
              "acc_x": "0.05",
              "acc_y": "-0.02",
              "acc_z": "0.98",
              "gyro_x": "0.01",
              "gyro_y": "-0.03",
              "gyro_z": "0.00",
              "latitude": "28.6139",
              "longitude": "77.2090",
              "speed": "45.5",
              "speed_limit": "40.0"
            }
          ]
        }
      }
    }
  }
}
```

### Data Fields

| Field | Type | Unit | Description |
|-------|------|------|-------------|
| `timestamp` | string | - | Format: "YYYY-MM-DD HH:MM:SS.mmm" |
| `acc_x` | string | g | Forward/backward acceleration |
| `acc_y` | string | g | Left/right acceleration |
| `acc_z` | string | g | Vertical acceleration |
| `gyro_x` | string | °/s | Gyroscope X-axis |
| `gyro_y` | string | °/s | Gyroscope Y-axis |
| `gyro_z` | string | °/s | Gyroscope Z-axis |
| `latitude` | string | decimal | GPS latitude |
| `longitude` | string | decimal | GPS longitude |
| `speed` | string | km/h | Current vehicle speed |
| `speed_limit` | string | km/h | Road speed limit |

### Data Parsing

The application automatically:
- Converts acceleration from g-force to m/s² (multiplies by 9.80665)
- Parses timestamps to milliseconds since epoch
- Converts string values to numbers for calculations
- Flags speed violations when `speed > speed_limit`
- Calculates total acceleration magnitude

## 📊 Dashboard Components

### 1. Sidebar Component
**Location:** `src/components/dashboard/Sidebar.tsx`

- User selection dropdown
- Ride selection for chosen user
- Real-time data synchronization
- Collapsible sidebar for mobile

### 2. Map View Component
**Location:** `src/components/dashboard/MapView.tsx`

**Features:**
- OpenStreetMap tile layer (free, no API key)
- Route polyline visualization
- Start/end markers
- Speed violation markers
- Interactive popups
- Auto-zoom to route bounds

**Configuration:**
```tsx
// Change tile provider in MapView.tsx
<TileLayer
  attribution='...'
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  maxZoom={19}
/>
```

### 3. Speed Chart Component
**Location:** `src/components/dashboard/SpeedChart.tsx`

- Line chart showing speed over sample index
- Speed limit overlay as shaded area
- Red dots marking violation points
- Violation counter
- Max speed indicator

### 4. Acceleration Chart Component
**Location:** `src/components/dashboard/AccelerationChart.tsx`

- Dual-axis acceleration (X and Y)
- Reference lines for safe limits
- Event detection:
  - Hard acceleration: accX > 3 m/s²
  - Hard braking: accX < -2 m/s²
  - Sharp turns: |accY| > 2 m/s²
- Event counters

### 5. Warnings List Component
**Location:** `src/components/dashboard/WarningsList.tsx`

- Chronological list of violations
- Speed violations with timestamp and location
- Acceleration events

### 6. Safety Scoring Module
**Location:** `src/lib/safety/` & UI demo at route `/safety`.

Implements per-ride safety scoring with:
* Proportional penalties: `(count/total_rows)*weight` per warning.
* Bump/Pothole contextual window penalties + clean handling bonus.
* Positive bonus for good rows (smooth + no warnings).
* Continuous overspeed severity scaling.
* Stars (0–5, 0.5 increments) from final score.