import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/providers.dart';
import '../models/models.dart';
import 'warning_card.dart';

/// Widget for displaying active warnings list
class ActiveWarnings extends StatelessWidget {
  const ActiveWarnings({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<RiderDataProvider>(
      builder: (context, riderDataProvider, child) {
        final warnings = riderDataProvider.activeWarnings;
        final isDarkMode = Theme.of(context).brightness == Brightness.dark;

        return Container(
          padding: const EdgeInsets.all(16),
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
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  Icon(
                    Icons.warning_amber,
                    color: warnings.isEmpty ? Colors.green : Colors.orange.shade600,
                    size: 24,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Active Warnings',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: isDarkMode ? Colors.white : Colors.grey.shade800,
                    ),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: warnings.isEmpty 
                          ? Colors.green.shade100 
                          : Colors.orange.shade100,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      '${warnings.length}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: warnings.isEmpty 
                            ? Colors.green.shade700 
                            : Colors.orange.shade700,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              
              // Warnings list - show in center if empty
              if (warnings.isEmpty)
                _buildEmptyState(context)
              else
                _buildWarningsList(warnings),
            ],
          ),
        );
      },
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(32),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.check_circle_outline,
              size: 64,
              color: Colors.green.shade400,
            ),
            const SizedBox(height: 16),
            Text(
              'All Clear!',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                color: Colors.green.shade700,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'No active warnings at the moment',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: Colors.grey.shade600,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWarningsList(List<Warning> warnings) {
    return Container(
      constraints: const BoxConstraints(maxHeight: 300),
      child: ListView.builder(
        shrinkWrap: true,
        itemCount: warnings.length,
        itemBuilder: (context, index) {
          final warning = warnings[index];
          return AnimatedSwitcher(
            duration: const Duration(milliseconds: 300),
            child: WarningCard(
              key: ValueKey(warning.id),
              warning: warning,
            ),
          );
        },
      ),
    );
  }
}