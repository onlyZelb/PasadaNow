import 'package:flutter/foundation.dart' show kIsWeb;

class ApiConstants {
  // ── API Gateway ───────────────────────────────────────────────────────────
  // All requests go through the gateway on port 8000.
  // On web (Chrome), use localhost.
  // On Android emulator, 10.0.2.2 maps to host machine's localhost.
  // On a real device, replace with your LAN IP (e.g. 192.168.x.x).

  static String get gatewayBase =>
      kIsWeb ? 'http://localhost:8000' : 'http://10.0.2.2:8000';
  static const String googleClientId = '509923494008-qr2n8die1rinopp4kh30c6drdidcalro.apps.googleusercontent.com';

  // ── Convenience getters (all point to gateway now) ────────────────────────
  static String get springBase => gatewayBase;
  static String get phpBase => gatewayBase;
  static String get djangoBase => gatewayBase;
}
