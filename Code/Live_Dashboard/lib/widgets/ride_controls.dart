import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/providers.dart';

/// Widget for ride control buttons (Start/End ride)
class RideControls extends StatelessWidget {
  const RideControls({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<RiderDataProvider>(
      builder: (context, riderDataProvider, child) {
        final isRideActive = riderDataProvider.isRideActive;
        final isLoading = riderDataProvider.isLoading;
        final rideStartTime = riderDataProvider.rideStartTime;
        final isDarkMode = Theme.of(context).brightness == Brightness.dark;

        return Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: isDarkMode ? Colors.grey.shade800 : Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.grey.withOpacity(0.1),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            children: [
              // Header
              Row(
                children: [
                  Icon(
                    isRideActive ? Icons.directions_bike : Icons.play_circle,
                    color: isRideActive ? Colors.green.shade600 : Colors.blue.shade600,
                    size: 24,
                  ),
                  const SizedBox(width: 8),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Ride Control',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: isDarkMode ? Colors.white : Colors.grey.shade800,
                        ),
                      ),
                      const SizedBox(height: 4),
                      // Display current ride id
                      Text(
                        'Ride ID: ${riderDataProvider.rideId}',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: isDarkMode ? Colors.white70 : Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 16),
              
              // Ride status indicator
              if (isRideActive && rideStartTime != null)
                _buildRideStatusIndicator(context, rideStartTime),
              
              const SizedBox(height: 16),
              
              // Control buttons
              Row(
                children: [
                  Expanded(
                    child: _buildStartButton(
                      context, 
                      riderDataProvider, 
                      isRideActive, 
                      isLoading,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildEndButton(
                      context, 
                      riderDataProvider, 
                      isRideActive, 
                      isLoading,
                    ),
                  ),
                ],
              ),
              
              // Error message
              if (riderDataProvider.errorMessage != null) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    border: Border.all(color: Colors.red.shade300),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.error, color: Colors.red.shade600, size: 16),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          riderDataProvider.errorMessage!,
                          style: TextStyle(
                            color: Colors.red.shade700,
                            fontSize: 12,
                          ),
                        ),
                      ),
                      InkWell(
                        onTap: riderDataProvider.clearError,
                        child: Icon(
                          Icons.close, 
                          color: Colors.red.shade600, 
                          size: 16,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _buildRideStatusIndicator(BuildContext context, DateTime startTime) {
    final duration = DateTime.now().difference(startTime);
    final hours = duration.inHours;
    final minutes = duration.inMinutes % 60;
    final seconds = duration.inSeconds % 60;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.green.shade50,
        border: Border.all(color: Colors.green.shade300),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Icon(Icons.access_time, color: Colors.green.shade600, size: 16),
          const SizedBox(width: 8),
          Text(
            'Ride Duration: ${hours.toString().padLeft(2, '0')}:${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}',
            style: TextStyle(
              color: Colors.green.shade700,
              fontWeight: FontWeight.w600,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStartButton(
    BuildContext context,
    RiderDataProvider riderDataProvider,
    bool isRideActive,
    bool isLoading,
  ) {
    final isEnabled = !isRideActive && !isLoading;

    return ElevatedButton.icon(
      onPressed: isEnabled ? () => _handleStartRide(riderDataProvider) : null,
      icon: isLoading && !isRideActive
          ? const SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : const Icon(Icons.play_arrow),
      label: const Text('Start Ride'),
      style: ElevatedButton.styleFrom(
        backgroundColor: isEnabled ? Colors.green.shade600 : Colors.grey.shade300,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(vertical: 12),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    );
  }

  Widget _buildEndButton(
    BuildContext context,
    RiderDataProvider riderDataProvider,
    bool isRideActive,
    bool isLoading,
  ) {
    final isEnabled = isRideActive && !isLoading;

    return ElevatedButton.icon(
      onPressed: isEnabled ? () => _handleEndRide(context, riderDataProvider) : null,
      icon: isLoading && isRideActive
          ? const SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : const Icon(Icons.stop),
      label: const Text('End Ride'),
      style: ElevatedButton.styleFrom(
        backgroundColor: isEnabled ? Colors.red.shade600 : Colors.grey.shade300,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(vertical: 12),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    );
  }

  Future<void> _handleStartRide(RiderDataProvider riderDataProvider) async {
    final success = await riderDataProvider.startRide();
    if (success) {
      // Optionally show success message
    }
  }

  Future<void> _handleEndRide(
    BuildContext context,
    RiderDataProvider riderDataProvider,
  ) async {
    // Show confirmation dialog
    final shouldEnd = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('End Ride'),
        content: const Text('Are you sure you want to end the current ride?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(
              foregroundColor: Colors.red,
            ),
            child: const Text('End Ride'),
          ),
        ],
      ),
    );

    if (shouldEnd == true) {
      final success = await riderDataProvider.endRide();
      if (success) {
        // Optionally show success message
      }
    }
  }
}