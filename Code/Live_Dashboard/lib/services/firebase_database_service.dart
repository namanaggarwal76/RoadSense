import 'package:firebase_database/firebase_database.dart';
import '../models/models.dart';
import 'firebase_auth_service.dart';

/// Service class for handling Firebase Realtime Database operations
class FirebaseDatabaseService {
  static final FirebaseDatabase _database = FirebaseDatabase.instance;

  /// Get reference to user's rider data
  static DatabaseReference? get _userRiderDataRef {
    final userId = FirebaseAuthService.currentUserId;
    if (userId == null) return null;
    return _database.ref().child('users').child(userId).child('rider_data');
  }

  /// Get reference to user's ride-scoped control
  static DatabaseReference? userRideScopedControlRef(String rideId) {
    final userId = FirebaseAuthService.currentUserId;
    if (userId == null) return null;
    return _database.ref().child('users').child(userId).child('rides').child(rideId).child('ride_control');
  }

  /// Listen to current speed changes
  static Stream<double> get currentSpeedStream {
    final ref = _userRiderDataRef?.child('speed');
    if (ref == null) return Stream.value(0.0);
    
    return ref.onValue.map((event) {
      if (event.snapshot.exists) {
        final value = event.snapshot.value;
        if (value is num) return value.toDouble();
      }
      return 0.0;
    });
  }

  /// Listen to speed limit changes
  static Stream<double> get speedLimitStream {
    final ref = _userRiderDataRef?.child('speed_limit');
    if (ref == null) return Stream.value(50.0);
    
    return ref.onValue.map((event) {
      if (event.snapshot.exists) {
        final value = event.snapshot.value;
        if (value is num) return value.toDouble();
      }
      return 50.0;
    });
  }

  /// Listen to inference text changes
  static Stream<String> get inferenceStream {
    final ref = _userRiderDataRef?.child('inference');
    if (ref == null) return Stream.value("");

    return ref.onValue.map((event) {
      if (event.snapshot.exists) {
        final value = event.snapshot.value;
        if (value is String) return value;
        if (value != null) return value.toString();
      }
      return "";
    });
  }

  /// Listen to active warnings changes
  static Stream<List<Warning>> get activeWarningsStream {
    final ref = _userRiderDataRef?.child('active_warnings');
    if (ref == null) return Stream.value([]);
    
    return ref.onValue.map((event) {
      final List<Warning> warnings = [];
      if (event.snapshot.exists && event.snapshot.value != null) {
        final raw = event.snapshot.value;

        if (raw is Map) {
          raw.forEach((key, value) {
            if (value is Map<dynamic, dynamic>) {
              warnings.add(Warning.fromMap(key.toString(), value));
            }
          });
        } else if (raw is List) {
          for (var i = 0; i < raw.length; i++) {
            final value = raw[i];
            if (value is Map<dynamic, dynamic>) {
              warnings.add(Warning.fromMap(i.toString(), value));
            }
          }
        }
      }
      return warnings;
    });
  }

  /// Listen to connection status
  static Stream<bool> get connectionStream {
    return _database.ref().child('.info/connected').onValue.map((event) {
      return event.snapshot.value as bool? ?? false;
    });
  }

  /// Start a ride (ride-scoped)
  static Future<void> startRide(String rideId) async {
    try {
      final ref = userRideScopedControlRef(rideId);
      if (ref == null) throw 'User not authenticated';

      await ref.update({
        'is_active': true,
        'start_time': ServerValue.timestamp,
      });

      // Ensure placeholders for raw_data and processed exist for the ride
      final parent = _database.ref().child('users').child(FirebaseAuthService.currentUserId!).child('rides').child(rideId);
      await parent.update({
        'raw_data': [],
        'processed': {},
      });
    } catch (e) {
      throw 'Failed to start ride: $e';
    }
  }

  /// Get next ride id for the current user by listing existing rides and
  /// returning the next integer as a string. Returns '0' if unauthenticated
  /// or if no rides exist yet.
  static Future<String> getNextRideId() async {
    final userId = FirebaseAuthService.currentUserId;
    if (userId == null) return '0';

    final ridesRef = _database.ref().child('users').child(userId).child('rides');
    final snapshot = await ridesRef.get();
    if (!snapshot.exists || snapshot.value == null) return '0';

    final raw = snapshot.value;
    if (raw == null) return '0';

    // If rides is a map (common), pick numeric keys; if it's a list, use indices.
    if (raw is Map) {
      if (raw.isEmpty) return '0';

      int maxId = -1;
      raw.keys.forEach((k) {
        final keyStr = k.toString();
        final parsed = int.tryParse(keyStr);
        if (parsed != null && parsed > maxId) maxId = parsed;
      });
      return (maxId + 1).toString();
    }

    if (raw is List) {
      int maxIndex = -1;
      for (var i = 0; i < raw.length; i++) {
        if (raw[i] != null) maxIndex = i > maxIndex ? i : maxIndex;
      }
      return (maxIndex + 1).toString();
    }

    return '0';
  }

  /// Create a new ride node under /users/{userId}/rides using an atomic
  /// numeric counter (`next_ride_id`) to guarantee sequential integer IDs.
  /// Initializes placeholders and returns the new numeric id as a string.
  static Future<String> createNewRide() async {
    final userId = FirebaseAuthService.currentUserId;
    if (userId == null) throw 'User not authenticated';

    final userRef = _database.ref().child('users').child(userId);
    final counterRef = userRef.child('next_ride_id');

    // Atomically increment the next_ride_id counter and use the result as the ride id.
    final transactionResult = await counterRef.runTransaction((Object? current) {
      final currentVal = (current is num)
          ? current.toInt()
          : (current is String ? int.tryParse(current) ?? 0 : 0);
      final newVal = currentVal + 1;
      return Transaction.success(newVal);
    });

    if (transactionResult.committed != true) {
      throw 'Failed to allocate new ride id';
    }

    var newIdValue = transactionResult.snapshot.value;
    var newIdInt = (newIdValue is num) ? newIdValue.toInt() : int.tryParse(newIdValue?.toString() ?? '') ?? 0;

    // If transaction yielded an unexpected value (e.g., non-numeric or 0),
    // fall back to scanning existing rides to compute the next id and set the counter.
    if (newIdInt <= 0) {
      final fallbackNext = int.tryParse(await getNextRideId()) ?? 0;
      final corrected = fallbackNext > 0 ? fallbackNext : 1;
      await counterRef.set(corrected);
      newIdInt = corrected;
    }

    var newId = newIdInt.toString();

    final rideRef = userRef.child('rides').child(newId);
    await rideRef.set({
      'ride_control': {
        'is_active': false,
        'start_time': null,
        'end_time': null,
      },
      'raw_data': [],
      'processed': {},
    });

    return newId;
  }

  /// End a ride (ride-scoped)
  static Future<void> endRide(String rideId) async {
    try {
      final ref = userRideScopedControlRef(rideId);
      if (ref == null) throw 'User not authenticated';

      // Clear any legacy `calculate_model` flag if present, then set end time
      final updates = {
        'is_active': false,
        'end_time': ServerValue.timestamp,
      };
      await ref.update(updates);
      // Remove calculate_model key if it exists (idempotent)
      await ref.child('calculate_model').remove();
    } catch (e) {
      throw 'Failed to end ride: $e';
    }
  }

  /// Listen to ride status changes (ride-scoped)
  static Stream<bool> rideStatusStream(String rideId) {
    final ref = userRideScopedControlRef(rideId)?.child('is_active');
    if (ref == null) return Stream.value(false);
    
    return ref.onValue.map((event) {
      if (event.snapshot.exists) {
        return event.snapshot.value as bool? ?? false;
      }
      return false;
    });
  }

  /// Listen to ride start timestamp (ride-scoped)
  static Stream<DateTime?> rideStartTimeStream(String rideId) {
    final ref = userRideScopedControlRef(rideId)?.child('start_time');
    if (ref == null) return Stream.value(null);
    
    return ref.onValue.map((event) {
      if (event.snapshot.exists) {
        final timestamp = event.snapshot.value;
        if (timestamp is num) {
          return DateTime.fromMillisecondsSinceEpoch(timestamp.toInt());
        }
      }
      return null;
    });
  }

  /// Initialize user data structure (call this after authentication)
  static Future<void> initializeUserData({String? rideId}) async {
    try {
      final userId = FirebaseAuthService.currentUserId;
      if (userId == null) throw 'User not authenticated';

      final userRef = _database.ref().child('users').child(userId);
      
      // Initialize rider_data structure if it doesn't exist (new schema keys)
      await userRef.child('rider_data').update({
        'speed': 0.0,
        'speed_limit': 50.0,
        'active_warnings': {},
        'inference': ""
      });

      // Initialize ride-scoped rider_control structure if rideId is provided
      if (rideId != null) {
        await userRef.child('rides').child(rideId).child('ride_control').update({
          'is_active': false,
          'start_time': null,
          'end_time': null,
        });
        // create placeholders
        await userRef.child('rides').child(rideId).update({
          'raw_data': [],
          'processed': {},
        });
      }
    } catch (e) {
      throw 'Failed to initialize user data: $e';
    }
  }
}