import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/providers.dart';
import '../widgets/widgets.dart';

/// Main In-Ride Warning Screen with all components
class InRideWarningScreen extends StatefulWidget {
  const InRideWarningScreen({super.key});

  @override
  State<InRideWarningScreen> createState() => _InRideWarningScreenState();
}

class _InRideWarningScreenState extends State<InRideWarningScreen> {
  @override
  void initState() {
    super.initState();
    // Initialize listeners when screen loads
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<RiderDataProvider>().initializeListeners();
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;
    
    return Scaffold(
      backgroundColor: isDarkMode ? Colors.grey.shade900 : Colors.grey.shade50,
      appBar: _buildAppBar(context),
      body: RefreshIndicator(
        onRefresh: _handleRefresh,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Speed Display Section
              const SpeedDisplay(),
              const SizedBox(height: 20),
              
              // Active Warnings Section
              const ActiveWarnings(),
              const SizedBox(height: 20),
              
              // Ride Controls Section
              const RideControls(),
            ],
          ),
        ),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar(BuildContext context) {
    return AppBar(
      title: const Text(
        'InRide Warning',
        style: TextStyle(
          fontWeight: FontWeight.bold,
        ),
      ),
      elevation: 0,
      actions: [
        // Connection Status Indicator
        const Padding(
          padding: EdgeInsets.only(right: 8),
          child: ConnectionStatus(),
        ),
        
        // Theme and Logout Menu
        PopupMenuButton<String>(
          icon: const Icon(Icons.more_vert),
          onSelected: (value) => _handleMenuAction(context, value),
          itemBuilder: (context) => [
            PopupMenuItem(
              value: 'theme_light',
              child: Row(
                children: [
                  Icon(Icons.light_mode, size: 16, color: Colors.orange.shade600),
                  const SizedBox(width: 8),
                  const Text('Light Mode'),
                ],
              ),
            ),
            PopupMenuItem(
              value: 'theme_dark',
              child: Row(
                children: [
                  Icon(Icons.dark_mode, size: 16, color: Colors.indigo.shade600),
                  const SizedBox(width: 8),
                  const Text('Dark Mode'),
                ],
              ),
            ),
            PopupMenuItem(
              value: 'theme_auto',
              child: Row(
                children: [
                  Icon(Icons.brightness_auto, size: 16, color: Colors.grey.shade600),
                  const SizedBox(width: 8),
                  const Text('Auto Mode'),
                ],
              ),
            ),
            const PopupMenuDivider(),
            const PopupMenuItem(
              value: 'logout',
              child: Row(
                children: [
                  Icon(Icons.logout, size: 16, color: Colors.red),
                  SizedBox(width: 8),
                  Text('Logout', style: TextStyle(color: Colors.red)),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }

  Future<void> _handleRefresh() async {
    // Refresh data by reinitializing listeners
    context.read<RiderDataProvider>().initializeListeners();
    await Future.delayed(const Duration(seconds: 1));
  }

  void _handleMenuAction(BuildContext context, String action) {
    final themeProvider = context.read<ThemeProvider>();
    
    switch (action) {
      case 'theme_light':
        themeProvider.setThemeMode(ThemeMode.light);
        break;
      case 'theme_dark':
        themeProvider.setThemeMode(ThemeMode.dark);
        break;
      case 'theme_auto':
        themeProvider.setThemeMode(ThemeMode.system);
        break;
      case 'logout':
        _handleLogout(context);
        break;
    }
  }

  void _handleLogout(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              context.read<AuthProvider>().signOut();
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Logout'),
          ),
        ],
      ),
    );
  }
}