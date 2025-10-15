import 'warning.dart';

/// Model class for rider data
class RiderData {
  final double currentSpeed;
  final double speedLimit;
  final List<Warning> activeWarnings;
  final bool isRideActive;
  final DateTime? rideStartTime;
  final String inference;

  const RiderData({
    this.currentSpeed = 0.0,
    this.speedLimit = 50.0,
    this.activeWarnings = const [],
    this.isRideActive = false,
    this.rideStartTime,
    this.inference = '',
  });

  RiderData copyWith({
    double? currentSpeed,
    double? speedLimit,
    List<Warning>? activeWarnings,
    bool? isRideActive,
    DateTime? rideStartTime,
    String? inference,
  }) {
    return RiderData(
      currentSpeed: currentSpeed ?? this.currentSpeed,
      speedLimit: speedLimit ?? this.speedLimit,
      activeWarnings: activeWarnings ?? this.activeWarnings,
      isRideActive: isRideActive ?? this.isRideActive,
      rideStartTime: rideStartTime ?? this.rideStartTime,
      inference: inference ?? this.inference,
    );
  }
}

/// Model class for connection status
enum ConnectionStatus {
  online,
  offline,
  connecting,
}