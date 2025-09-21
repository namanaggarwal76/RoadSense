import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';

/// Provider for managing app theme mode
class ThemeProvider extends ChangeNotifier {
  ThemeMode _themeMode = ThemeMode.system;

  /// Current theme mode
  ThemeMode get themeMode => _themeMode;

  /// Get current brightness based on theme mode
  Brightness get currentBrightness {
    switch (_themeMode) {
      case ThemeMode.light:
        return Brightness.light;
      case ThemeMode.dark:
        return Brightness.dark;
      case ThemeMode.system:
        return SchedulerBinding.instance.platformDispatcher.platformBrightness;
    }
  }

  /// Check if currently in dark mode
  bool get isDarkMode => currentBrightness == Brightness.dark;

  /// Set theme mode
  void setThemeMode(ThemeMode mode) {
    _themeMode = mode;
    _updateSystemUI();
    notifyListeners();
  }

  /// Toggle between light and dark mode
  void toggleTheme() {
    if (_themeMode == ThemeMode.light) {
      setThemeMode(ThemeMode.dark);
    } else {
      setThemeMode(ThemeMode.light);
    }
  }

  /// Update system UI overlay style based on current theme
  void _updateSystemUI() {
    SystemChrome.setSystemUIOverlayStyle(
      SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: isDarkMode ? Brightness.light : Brightness.dark,
        statusBarBrightness: isDarkMode ? Brightness.dark : Brightness.light,
        systemNavigationBarColor: isDarkMode ? Colors.grey.shade900 : Colors.white,
        systemNavigationBarIconBrightness: isDarkMode ? Brightness.light : Brightness.dark,
      ),
    );
  }

  /// Initialize theme provider
  void initialize() {
    _updateSystemUI();
  }
}