import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import 'login_screen.dart';

class PendingScreen extends StatelessWidget {
  const PendingScreen({super.key});

  // Matches the palette used across login_screen / register_screen
  static const Color _bgDeep      = Color(0xFF0B1B35);
  static const Color _bgCard      = Color(0xFF102245);
  static const Color _accent      = Color(0xFF3D7FD4);
  static const Color _accentLight = Color(0xFF5B9BF0);
  static const Color _orange      = Color(0xFFE8863A);
  static const Color _textPrimary = Color(0xFFE8EEF7);
  static const Color _textMuted   = Color(0xFF8A9BC0);
  static const Color _borderDef   = Color(0xFF1E3A6E);
  static const Color _inputBg     = Color(0xFF0D1E3D);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bgDeep,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 40),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 20),

              // ── Brand ──────────────────────────────────────────────────
              Container(
                width: 90,
                height: 90,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: _accentLight.withOpacity(0.5),
                      blurRadius: 28, spreadRadius: 4,
                    ),
                  ],
                ),
                child: Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: _accentLight.withOpacity(0.5), width: 2.5),
                    gradient: const LinearGradient(
                      colors: [Color(0xFF2A5FC0), Color(0xFF0D1E3D)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: ClipOval(
                    child: Image.asset(
                      'assets/logo.png',
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => const Center(
                        child: Icon(Icons.directions_bike,
                            color: Colors.white, size: 38),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              RichText(
                text: const TextSpan(
                  style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900),
                  children: [
                    TextSpan(text: 'Pasada',
                        style: TextStyle(color: _textPrimary)),
                    TextSpan(text: 'Now',
                        style: TextStyle(color: _orange)),
                  ],
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'TRICYCLE RIDE HAILING SYSTEM',
                style: TextStyle(
                  fontSize: 10, letterSpacing: 2.5,
                  color: _textMuted, fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 36),

              // ── Status card ────────────────────────────────────────────
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(28),
                decoration: BoxDecoration(
                  color: _bgCard,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: _borderDef, width: 1),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.3),
                      blurRadius: 24, offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    // Animated hourglass icon
                    Container(
                      width: 72, height: 72,
                      decoration: BoxDecoration(
                        color: _orange.withOpacity(0.1),
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: _orange.withOpacity(0.35), width: 1.5),
                      ),
                      child: const Center(
                        child: Text('⏳', style: TextStyle(fontSize: 32)),
                      ),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'Account Pending Verification',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 20, fontWeight: FontWeight.w800,
                        color: _textPrimary, letterSpacing: -0.3,
                      ),
                    ),
                    const SizedBox(height: 10),
                    const Text(
                      'Your account has been submitted and is awaiting '
                      'admin review. This usually takes 24–48 hours.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 14, color: _textMuted, height: 1.6),
                    ),
                    const SizedBox(height: 24),

                    // ── Status steps ────────────────────────────────────
                    _StatusStep(
                      emoji: '✅',
                      label: 'Account registered',
                      done: true,
                    ),
                    const SizedBox(height: 12),
                    _StatusStep(
                      emoji: '🔍',
                      label: 'Admin review in progress',
                      done: false,
                      active: true,
                    ),
                    const SizedBox(height: 12),
                    _StatusStep(
                      emoji: '🚀',
                      label: 'Account activated — start riding!',
                      done: false,
                    ),
                    const SizedBox(height: 28),

                    // ── Info notice ────────────────────────────────────
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: _accent.withOpacity(0.07),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: _accent.withOpacity(0.2), width: 1),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Text('💡', style: TextStyle(fontSize: 15)),
                          SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'You will be notified once your account is '
                              'approved. Make sure your submitted documents '
                              'are clear and valid.',
                              style: TextStyle(
                                color: _textMuted,
                                fontSize: 12, height: 1.55),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // ── Sign out button ───────────────────────────────
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: OutlinedButton.icon(
                        onPressed: () async {
                          await context.read<AuthProvider>().logout();
                          if (context.mounted) {
                            Navigator.pushReplacement(
                              context,
                              MaterialPageRoute(
                                  builder: (_) => const LoginScreen()),
                            );
                          }
                        },
                        style: OutlinedButton.styleFrom(
                          foregroundColor: _textMuted,
                          side: const BorderSide(color: _borderDef),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                          backgroundColor: _inputBg,
                        ),
                        icon: const Text('🚪',
                            style: TextStyle(fontSize: 16)),
                        label: const Text(
                          'Sign Out & Try Again Later',
                          style: TextStyle(
                            fontSize: 14, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Small reusable step indicator ─────────────────────────────────────────
class _StatusStep extends StatelessWidget {
  final String emoji;
  final String label;
  final bool done;
  final bool active;

  const _StatusStep({
    required this.emoji,
    required this.label,
    this.done = false,
    this.active = false,
  });

  static const Color _accent      = Color(0xFF3D7FD4);
  static const Color _accentLight = Color(0xFF5B9BF0);
  static const Color _orange      = Color(0xFFE8863A);
  static const Color _green       = Color(0xFF22C55E);
  static const Color _textPrimary = Color(0xFFE8EEF7);
  static const Color _textMuted   = Color(0xFF8A9BC0);
  static const Color _borderDef   = Color(0xFF1E3A6E);
  static const Color _inputBg     = Color(0xFF0D1E3D);

  @override
  Widget build(BuildContext context) {
    final Color color = done
        ? _green
        : active
            ? _orange
            : _textMuted;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
      decoration: BoxDecoration(
        color: done
            ? _green.withOpacity(0.07)
            : active
                ? _orange.withOpacity(0.07)
                : _inputBg,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: done
              ? _green.withOpacity(0.25)
              : active
                  ? _orange.withOpacity(0.3)
                  : _borderDef,
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Text(emoji, style: const TextStyle(fontSize: 18)),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight:
                    active ? FontWeight.w700 : FontWeight.w500,
                color: done || active ? color : _textMuted,
              ),
            ),
          ),
          if (done)
            const Text('✓',
                style: TextStyle(
                    color: _green,
                    fontSize: 15,
                    fontWeight: FontWeight.w800))
          else if (active)
            const SizedBox(
              width: 14, height: 14,
              child: CircularProgressIndicator(
                color: _orange, strokeWidth: 2),
            ),
        ],
      ),
    );
  }
}