import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'constants.dart';

// ── Custom exception ───────────────────────────────────────────────────────
class AuthException implements Exception {
  final String message;
  const AuthException(this.message);

  @override
  String toString() => message;
}

// ── AuthService ────────────────────────────────────────────────────────────
class AuthService {
  final Dio _dio = Dio(BaseOptions(
    baseUrl: ApiConstants.springBase,
    connectTimeout: const Duration(seconds: 30),
    receiveTimeout: const Duration(seconds: 30),
    headers: {'Content-Type': 'application/json'},
  ));

  final FlutterSecureStorage _storage = const FlutterSecureStorage(
    webOptions: WebOptions(
      dbName: 'pasadanow',
      publicKey: 'pasadanow_key',
    ),
  );

  // ── Google Sign-In client ─────────────────────────────────────────────────
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    clientId: kIsWeb ? ApiConstants.googleClientId : null,
    serverClientId: kIsWeb ? null : ApiConstants.googleClientId,
    scopes: ['email', 'profile', 'openid'],
  );

  // ── Auth session keys ─────────────────────────────────────────────────────
  static const _keyToken = 'auth_token';
  static const _keyRole = 'auth_role';
  static const _keyVerifiedStatus = 'auth_verified_status';
  static const _keyUsername = 'auth_username';

  // ── Remember Me keys ─────────────────────────────────────────────────────
  static const _rmEnabled = 'rm_enabled';
  static const _rmUsername = 'rm_username';
  static const _rmPassword = 'rm_password';

  // ── Local Login ───────────────────────────────────────────────────────────
  Future<Map<String, dynamic>> login(String username, String password) async {
    try {
      final response = await _dio.post(
        '/api/auth/login',
        data: {'username': username, 'password': password},
      );

      final data = response.data as Map<String, dynamic>;
      final token = data['token'] as String?;
      final role = data['role'] as String?;
      final verifiedStatus = data['verifiedStatus'] as String?;
      final returnedUser = data['username'] as String?;

      if (token == null || role == null) {
        throw const AuthException('Unexpected response from server.');
      }

      try {
        await _storage.write(key: _keyToken, value: token);
        await _storage.write(key: _keyRole, value: role);
        await _storage.write(
            key: _keyVerifiedStatus, value: verifiedStatus ?? '');
        await _storage.write(
            key: _keyUsername, value: returnedUser ?? username);
      } catch (_) {}

      return {
        'token': token,
        'role': role,
        'verifiedStatus': verifiedStatus,
        'username': returnedUser ?? username,
      };
    } on DioException catch (e) {
      _handleDioError(e, fallback: 'Login failed. Please try again.');
      rethrow;
    }
  }

  // ── Google Login ──────────────────────────────────────────────────────────
  Future<Map<String, dynamic>> googleLogin() async {
    final googleUser = await _googleSignIn.signIn();
    if (googleUser == null) {
      throw const AuthException('Google sign-in was cancelled.');
    }

    final googleAuth = await googleUser.authentication;
    final String? tokenToSend = googleAuth.idToken ?? googleAuth.accessToken;
    final bool isAccessToken = googleAuth.idToken == null;

    if (tokenToSend == null) {
      throw const AuthException(
          'Could not get Google token. Please try again.');
    }

    try {
      final response = await _dio.post(
        '/api/auth/google',
        data: {
          'token': tokenToSend,
          'isAccessToken': isAccessToken,
          'email': googleUser.email,
          'displayName': googleUser.displayName,
        },
      );

      final data = response.data as Map<String, dynamic>;
      final token = data['token'] as String?;
      final role = data['role'] as String?;
      final verifiedStatus = data['verifiedStatus'] as String?;
      final returnedUser = data['username'] as String?;

      if (token == null || role == null) {
        throw const AuthException('Unexpected response from server.');
      }

      try {
        await _storage.write(key: _keyToken, value: token);
        await _storage.write(key: _keyRole, value: role);
        await _storage.write(
            key: _keyVerifiedStatus, value: verifiedStatus ?? '');
        await _storage.write(
            key: _keyUsername, value: returnedUser ?? googleUser.email);
      } catch (_) {}

      return {
        'token': token,
        'role': role,
        'verifiedStatus': verifiedStatus,
        'username': returnedUser ?? googleUser.email,
      };
    } on DioException catch (e) {
      await _googleSignIn.signOut();
      _handleDioError(e, fallback: 'Google login failed. Please try again.');
      rethrow;
    }
  }

  // ── Register ─────────────────────────────────────────────────────────────
  Future<void> register(Map<String, dynamic> data) async {
    final body = <String, dynamic>{
      'username': data['username'] ?? '',
      'password': data['password'] ?? '',
      'fullName': data['fullName'] ?? '',
      'age': data['age'] ?? '',
      'phone': data['phone'] ?? '',
      'email': data['email'] ?? '',
      'address': data['address'] ?? '',
      'role': data['role'] ?? '',
      if (data['profilePhoto'] != null) 'profilePhoto': data['profilePhoto'],
      if (data['role'] == 'driver') ...{
        'licenseNo': data['licenseNo'] ?? '',
        'plateNo': data['plateNo'] ?? '',
        'todaNo': data['todaNo'] ?? '',
        if (data['photoLicense'] != null) 'photoLicense': data['photoLicense'],
        if (data['photoPlate'] != null) 'photoPlate': data['photoPlate'],
        if (data['photoToda'] != null) 'photoToda': data['photoToda'],
      },
    };

    try {
      await _dio.post('/api/auth/register', data: body);
    } on DioException catch (e) {
      _handleDioError(e, fallback: 'Registration failed. Please try again.');
    }
  }

  // ── Forgot Password — Step 1: request OTP ────────────────────────────────
  Future<void> forgotPassword(String email) async {
    try {
      await _dio.post(
        '/api/auth/forgot-password',
        data: {'email': email},
      );
    } on DioException catch (e) {
      _handleDioError(e, fallback: 'Failed to send OTP. Please try again.');
    }
  }

  // ── Reset Password — Step 2: submit OTP + new password ───────────────────
  Future<void> resetPassword({
    required String email,
    required String otp,
    required String newPassword,
  }) async {
    try {
      await _dio.post(
        '/api/auth/reset-password',
        data: {
          'email': email,
          'otp': otp,
          'newPassword': newPassword,
        },
      );
    } on DioException catch (e) {
      _handleDioError(e, fallback: 'Password reset failed. Please try again.');
    }
  }

  // ── Logout ───────────────────────────────────────────────────────────────
  Future<void> logout({String? role}) async {
    try {
      if (role == 'driver') {
        final token = await getToken();
        if (token != null) {
          final dio = Dio(BaseOptions(baseUrl: ApiConstants.phpBase));
          await dio.patch(
            '/api/drivers/me/status',
            data: jsonEncode({'is_online': false, 'lat': null, 'lng': null}),
            options: Options(
              headers: {
                'Authorization': 'Bearer $token',
                'Content-Type': 'application/json',
              },
            ),
          );
        }
      }
      await _dio.post('/api/auth/logout');
    } catch (_) {
    } finally {
      try {
        await _googleSignIn.signOut();
      } catch (_) {}

      try {
        final rmEnabled = await _storage.read(key: _rmEnabled);
        final rmUsername = await _storage.read(key: _rmUsername);
        final rmPassword = await _storage.read(key: _rmPassword);

        await _storage.delete(key: _keyToken);
        await _storage.delete(key: _keyRole);
        await _storage.delete(key: _keyVerifiedStatus);
        await _storage.delete(key: _keyUsername);

        if (rmEnabled != null)
          await _storage.write(key: _rmEnabled, value: rmEnabled);
        if (rmUsername != null)
          await _storage.write(key: _rmUsername, value: rmUsername);
        if (rmPassword != null)
          await _storage.write(key: _rmPassword, value: rmPassword);
      } catch (_) {}
    }
  }

  // ── Secure storage readers ────────────────────────────────────────────────
  Future<String?> getToken() async {
    try {
      return await _storage.read(key: _keyToken);
    } catch (_) {
      return null;
    }
  }

  Future<String?> getRole() async {
    try {
      return await _storage.read(key: _keyRole);
    } catch (_) {
      return null;
    }
  }

  Future<String?> getVerifiedStatus() async {
    try {
      return await _storage.read(key: _keyVerifiedStatus);
    } catch (_) {
      return null;
    }
  }

  Future<String?> getUsername() async {
    try {
      return await _storage.read(key: _keyUsername);
    } catch (_) {
      return null;
    }
  }

  // ── Shared error handler ──────────────────────────────────────────────────
  Never _handleDioError(DioException e, {required String fallback}) {
    final serverMsg = e.response?.data is Map
        ? (e.response!.data as Map)['message'] as String?
        : null;

    if (e.response?.statusCode == 401) {
      throw AuthException(serverMsg ?? 'Wrong password.');
    } else if (e.response?.statusCode == 404) {
      throw AuthException(serverMsg ?? 'Account not found.');
    } else if (e.response?.statusCode == 409 || e.response?.statusCode == 400) {
      throw AuthException(serverMsg ?? 'Username already taken.');
    } else if (e.response?.statusCode == 422) {
      throw AuthException(serverMsg ?? 'Please fill in all required fields.');
    } else if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout) {
      throw const AuthException('Connection timed out. Check your internet.');
    } else {
      throw AuthException(serverMsg ?? fallback);
    }
  }
}
