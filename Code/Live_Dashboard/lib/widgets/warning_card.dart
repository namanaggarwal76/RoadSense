import 'package:flutter/material.dart';
import '../models/models.dart';

/// Individual warning card widget
class WarningCard extends StatelessWidget {
  final Warning warning;

  const WarningCard({
    super.key,
    required this.warning,
  });

  @override
  Widget build(BuildContext context) {
    final colorData = _getWarningColorData(warning.type);

    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
          colors: [
            colorData.backgroundColor,
            colorData.backgroundColor.withOpacity(0.8),
          ],
        ),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: colorData.backgroundColor.withOpacity(0.3),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            // Warning icon
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                colorData.icon,
                color: Colors.white,
                size: 24,
              ),
            ),
            const SizedBox(width: 12),
            
            // Warning content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    warning.message,
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _formatTimestamp(warning.timestamp),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.white.withOpacity(0.8),
                    ),
                  ),
                ],
              ),
            ),
            
            // Warning type badge
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: 8,
                vertical: 4,
              ),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                warning.type.toUpperCase(),
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 10,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Get color scheme and icon for warning type
  _WarningColorData _getWarningColorData(String type) {
    switch (type.toLowerCase()) {
      case 'vehicle_too_close':
        return _WarningColorData(
          backgroundColor: Colors.red.shade500,
          icon: Icons.directions_car,
        );
      case 'pothole':
        return _WarningColorData(
          backgroundColor: Colors.orange.shade500,
          icon: Icons.warning,
        );
      case 'speed_limit':
        return _WarningColorData(
          backgroundColor: Colors.red.shade600,
          icon: Icons.speed,
        );
      case 'bump_ahead':
        return _WarningColorData(
          backgroundColor: Colors.brown.shade400,
          icon: Icons.terrain,
        );
      case 'comes':
        return _WarningColorData(
          backgroundColor: Colors.grey.shade600,
          icon: Icons.info,
        );
      default:
        return _WarningColorData(
          backgroundColor: Colors.grey.shade600,
          icon: Icons.info,
        );
    }
  }

  /// Format timestamp for display
  String _formatTimestamp(DateTime timestamp) {
    final now = DateTime.now();
    final difference = now.difference(timestamp);

    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h ago';
    } else {
      return '${timestamp.day}/${timestamp.month}';
    }
  }
}

/// Helper class for warning color data
class _WarningColorData {
  final Color backgroundColor;
  final IconData icon;

  const _WarningColorData({
    required this.backgroundColor,
    required this.icon,
  });
}