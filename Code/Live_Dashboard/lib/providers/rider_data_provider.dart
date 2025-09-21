import 'dart:async';
import 'package:flutter/foundation.dart';
import '../models/models.dart';
import '../services/services.dart';

/// Provider class for managing rider data and connection status
class RiderDataProvider extends ChangeNotifier {
  RiderData _riderData = const RiderData();
  ConnectionStatus _connectionStatus = ConnectionStatus.offline;
  bool _isLoading = false;
  String? _errorMessage;

  // Subscriptions for real-time data
  StreamSubscription? _speedSubscription;
  StreamSubscription? _speedLimitSubscription;
  StreamSubscription? _inferenceSubscription;
  StreamSubscription? _warningsSubscription;
  StreamSubscription? _connectionSubscription;
  StreamSubscription? _rideStatusSubscription;
  StreamSubscription? _rideStartTimeSubscription;

  // Current rideId (should be set by UI or logic)
  String _rideId = '0';
  String get rideId => _rideId;
  set rideId(String id) {
    _rideId = id;
    // Re-initialize listeners for new ride
    initializeListeners();
  }

  /// Current rider data
  RiderData get riderData => _riderData;

  /// Connection status
  ConnectionStatus get connectionStatus => _connectionStatus;

  /// Is loading
  bool get isLoading => _isLoading;

  /// Error message
  String? get errorMessage => _errorMessage;

  /// Current speed
  double get currentSpeed => _riderData.currentSpeed;

  /// Speed limit
  double get speedLimit => _riderData.speedLimit;

  /// Inference text
  String get inference => _riderData.inference;

  /// Active warnings
  List<Warning> get activeWarnings => _riderData.activeWarnings;

  /// Is ride active
  bool get isRideActive => _riderData.isRideActive;

  /// Ride start time
  DateTime? get rideStartTime => _riderData.rideStartTime;

  /// Initialize real-time listeners
  void initializeListeners() {
    _listenToCurrentSpeed();
    _listenToSpeedLimit();
    _listenToInference();
    _listenToActiveWarnings();
    _listenToConnectionStatus();
    _listenToRideStatus(_rideId);
    _listenToRideStartTime(_rideId);
  }

  /// Listen to current speed changes
  void _listenToCurrentSpeed() {
    _speedSubscription?.cancel();
    _speedSubscription = FirebaseDatabaseService.currentSpeedStream.listen(
      (speed) {
        _riderData = _riderData.copyWith(currentSpeed: speed);
        notifyListeners();
      },
      onError: (error) {
        _setError('Failed to load speed data: $error');
      },
    );
  }

  /// Listen to speed limit changes
  void _listenToSpeedLimit() {
    _speedLimitSubscription?.cancel();
    _speedLimitSubscription = FirebaseDatabaseService.speedLimitStream.listen(
      (speedLimit) {
        _riderData = _riderData.copyWith(speedLimit: speedLimit);
        notifyListeners();
      },
      onError: (error) {
        _setError('Failed to load speed limit: $error');
      },
    );
  }

  /// Listen to inference changes
  void _listenToInference() {
    _inferenceSubscription?.cancel();
    _inferenceSubscription = FirebaseDatabaseService.inferenceStream.listen(
      (inference) {
        _riderData = _riderData.copyWith(inference: inference);
        notifyListeners();
      },
      onError: (error) {
        _setError('Failed to load inference: $error');
      },
    );
  }

  /// Listen to active warnings changes
  void _listenToActiveWarnings() {
    _warningsSubscription?.cancel();
    _warningsSubscription = FirebaseDatabaseService.activeWarningsStream.listen(
      (warnings) {
        _riderData = _riderData.copyWith(activeWarnings: warnings);
        notifyListeners();
      },
      onError: (error) {
        _setError('Failed to load warnings: $error');
      },
    );
  }

  /// Listen to connection status
  void _listenToConnectionStatus() {
    _connectionSubscription?.cancel();
    _connectionSubscription = FirebaseDatabaseService.connectionStream.listen(
      (isConnected) {
        _connectionStatus = isConnected 
            ? ConnectionStatus.online 
            : ConnectionStatus.offline;
        notifyListeners();
      },
      onError: (error) {
        _connectionStatus = ConnectionStatus.offline;
        notifyListeners();
      },
    );
  }

  /// Listen to ride status changes (ride-scoped)
  void _listenToRideStatus(String rideId) {
    _rideStatusSubscription?.cancel();
    _rideStatusSubscription = FirebaseDatabaseService.rideStatusStream(rideId).listen(
      (isActive) {
        _riderData = _riderData.copyWith(isRideActive: isActive);
        notifyListeners();
      },
      onError: (error) {
        _setError('Failed to load ride status: $error');
      },
    );
  }

  /// Listen to ride start time changes (ride-scoped)
  void _listenToRideStartTime(String rideId) {
    _rideStartTimeSubscription?.cancel();
    _rideStartTimeSubscription = FirebaseDatabaseService.rideStartTimeStream(rideId).listen(
      (startTime) {
        _riderData = _riderData.copyWith(rideStartTime: startTime);
        notifyListeners();
      },
      onError: (error) {
        _setError('Failed to load ride start time: $error');
      },
    );
  }

  /// Start a ride (ride-scoped)
  Future<bool> startRide() async {
    _setLoading(true);
    _clearError();

    try {
      // Always create a new ride node and assign its id before starting
      final newRideKey = await FirebaseDatabaseService.createNewRide();
      if (newRideKey.isEmpty) throw 'Failed to create ride';
      // set rideId (this will reinitialize listeners)
      rideId = newRideKey;
      await FirebaseDatabaseService.startRide(_rideId);
      return true;
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  /// End a ride (ride-scoped)
  Future<bool> endRide() async {
    _setLoading(true);
    _clearError();

    try {
      await FirebaseDatabaseService.endRide(_rideId);
      return true;
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  /// Initialize user data in Firebase (optionally ride-scoped)
  Future<bool> initializeUserData({String? rideId}) async {
    _setLoading(true);
    _clearError();

    try {
      await FirebaseDatabaseService.initializeUserData(rideId: rideId ?? _rideId);
      return true;
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  /// Set loading state
  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  /// Set error message
  void _setError(String error) {
    _errorMessage = error;
    notifyListeners();
  }

  /// Clear error message
  void _clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  /// Clear error manually
  void clearError() {
    _clearError();
  }

  /// Dispose subscriptions
  @override
  void dispose() {
    _speedSubscription?.cancel();
    _speedLimitSubscription?.cancel();
    _warningsSubscription?.cancel();
    _connectionSubscription?.cancel();
    _rideStatusSubscription?.cancel();
    _rideStartTimeSubscription?.cancel();
    super.dispose();
  }
}