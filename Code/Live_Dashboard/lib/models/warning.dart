/// Model class for warning data
class Warning {
  final String id;
  final String type;
  final String message;
  final DateTime timestamp;

  const Warning({
    required this.id,
    required this.type,
    required this.message,
    required this.timestamp,
  });

  /// Create Warning from Firebase data
  factory Warning.fromMap(String id, Map<dynamic, dynamic> data) {
    return Warning(
      id: id,
      type: data['type'] ?? 'unknown',
      message: data['message'] ?? 'Unknown warning',
      timestamp: DateTime.fromMillisecondsSinceEpoch(
        data['timestamp'] ?? DateTime.now().millisecondsSinceEpoch,
      ),
    );
  }

  /// Convert Warning to Map for Firebase
  Map<String, dynamic> toMap() {
    return {
      'type': type,
      'message': message,
      'timestamp': timestamp.millisecondsSinceEpoch,
    };
  }
}