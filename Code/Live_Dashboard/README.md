# 🏍️ InRide Warning App

A Flutter application for real-time motorcycle riding warnings with Firebase integration. The app provides speed monitoring, active warnings display, and ride tracking with a beautiful dark/light theme interface.

[Live Link](https://wheeler-event-detection.web.app/)

![Flutter](https://img.shields.io/badge/Flutter-02569B?style=for-the-badge&logo=flutter&logoColor=white)
![Firebase](https://img.shields.io/badge/firebase-ffca28?style=for-the-badge&logo=firebase&logoColor=black)
![Android](https://img.shields.io/badge/Android-3DDC84?style=for-the-badge&logo=android&logoColor=white)
![Web](https://img.shields.io/badge/Web-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white)

## ✨ Features

### 🔐 **Authentication**
- Firebase Authentication with email/password
- Secure user sessions with automatic routing
- Clean login/register interface

### 📊 **Real-time Dashboard**
- **Speed Monitoring** - Live speed display with speed limit comparison
- **Active Warnings** - Color-coded warning cards with distinct icons
- **Ride Controls** - Start/End ride functionality with timestamps
- **Connection Status** - Real-time Firebase connection indicator

### 🎨 **Theme Support**
- 🌞 **Light Mode** - Clean, bright interface
- 🌙 **Dark Mode** - Professional dark theme with proper contrast
- 🔄 **Auto Mode** - Follows system theme preference
- Seamless theme switching with system UI adaptation

### ⚠️ **Warning Types**
- 🚗 **Vehicle Too Close** (Red)
- 🕳️ **Pothole Ahead** (Orange)
- 🚀 **Speed Limit Exceeded** (Red)
- � **Bump Ahead** (Brown)

## 🛠️ Tech Stack

- **Framework**: Flutter (Dart)
- **Backend**: Firebase (Auth + Realtime Database)
- **State Management**: Provider
- **Platforms**: Android & Web
- **Architecture**: Clean Architecture with separation of concerns

## 📂 Project Structure

```
lib/
├── models/           # Data models (Warning, RiderData)
├── providers/        # State management (Auth, RiderData, Theme)
├── screens/          # UI screens (Login, InRideWarning)
├── services/         # Firebase services (Auth, Database)
├── widgets/          # Reusable UI components
└── main.dart         # App entry point
```

## 🚀 Quick Start

### Prerequisites
- Flutter SDK (latest stable)
- Firebase project
- Android Studio / VS Code
- Chrome browser (for web testing)

## 🏃‍♂️ Running the App

### Web
```bash
flutter build web
flutter run -d web-server
```
