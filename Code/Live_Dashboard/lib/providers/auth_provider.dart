import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import '../services/services.dart';

/// Provider class for managing authentication state
class AuthProvider extends ChangeNotifier {
  User? _user;
  bool _isLoading = false;
  String? _errorMessage;

  /// Current user
  User? get user => _user;

  /// Current user ID
  String? get userId => _user?.uid;

  /// Is user authenticated
  bool get isAuthenticated => _user != null;

  /// Is loading
  bool get isLoading => _isLoading;

  /// Error message
  String? get errorMessage => _errorMessage;

  /// Initialize the auth provider
  AuthProvider() {
    _initAuthListener();
  }

  /// Initialize authentication state listener
  void _initAuthListener() {
    FirebaseAuthService.authStateChanges.listen((User? user) {
      _user = user;
      notifyListeners();
    });
  }

  /// Sign in with email and password
  Future<bool> signIn(String email, String password) async {
    _setLoading(true);
    _clearError();

    try {
      await FirebaseAuthService.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      return true;
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  /// Register with email and password
  Future<bool> register(String email, String password) async {
    _setLoading(true);
    _clearError();

    try {
      await FirebaseAuthService.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );
      return true;
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  /// Sign out
  Future<void> signOut() async {
    _setLoading(true);
    _clearError();

    try {
      await FirebaseAuthService.signOut();
    } catch (e) {
      _setError(e.toString());
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
}