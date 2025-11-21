import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/providers.dart';
import '../models/rider_data.dart' as rider_models;

/// Widget for displaying network connectivity status
class ConnectionStatus extends StatelessWidget {
  const ConnectionStatus({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<RiderDataProvider>(
      builder: (context, riderDataProvider, child) {
        final connectionStatus = riderDataProvider.connectionStatus;
        final colorData = _getConnectionColorData(connectionStatus);

        return AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: colorData.backgroundColor,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: colorData.backgroundColor.withOpacity(0.3),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 300),
                child: Icon(
                  colorData.icon,
                  key: ValueKey(connectionStatus),
                  color: Colors.white,
                  size: 16,
                ),
              ),
              const SizedBox(width: 6),
              Text(
                colorData.text,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  /// Get color scheme, icon, and text for connection status
  _ConnectionColorData _getConnectionColorData(rider_models.ConnectionStatus status) {
    switch (status) {
      case rider_models.ConnectionStatus.online:
        return const _ConnectionColorData(
          backgroundColor: Colors.green,
          icon: Icons.wifi,
          text: 'Online',
        );
      case rider_models.ConnectionStatus.offline:
        return const _ConnectionColorData(
          backgroundColor: Colors.red,
          icon: Icons.wifi_off,
          text: 'Offline',
        );
      case rider_models.ConnectionStatus.connecting:
        return const _ConnectionColorData(
          backgroundColor: Colors.orange,
          icon: Icons.wifi_protected_setup,
          text: 'Connecting',
        );
    }
  }
}

/// Helper class for connection color data
class _ConnectionColorData {
  final Color backgroundColor;
  final IconData icon;
  final String text;

  const _ConnectionColorData({
    required this.backgroundColor,
    required this.icon,
    required this.text,
  });
}