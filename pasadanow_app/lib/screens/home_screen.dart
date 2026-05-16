import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../widgets/shared_widgets.dart';
import 'login_screen.dart';
import 'register_screen.dart';
import 'settings_legal_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  void _goToLogin() {
    Navigator.push(
        context, MaterialPageRoute(builder: (_) => const LoginScreen()));
  }

  void _goToRegister() {
    Navigator.push(
        context, MaterialPageRoute(builder: (_) => const RegisterScreen()));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgDeep,
      body: Column(
        children: [
          _buildTopBar(),
          Expanded(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildHero(),
                  _buildHowItWorks(),
                  _buildFeaturesSection(),
                  _buildDriverCTA(),
                  _buildSettingsLinks(),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── TOP BAR ───────────────────────────────────────────────────────────────
  Widget _buildTopBar() {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.bgDeep,
        border: Border(bottom: BorderSide(color: AppColors.border)),
      ),
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 10,
        bottom: 12,
        left: 16,
        right: 16,
      ),
      child: Row(
        children: [
          // ── Brand logo ──────────────────────────────────────────────────
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF5B9BF0).withOpacity(0.55),
                  blurRadius: 14,
                  spreadRadius: 2,
                ),
                BoxShadow(
                  color: const Color(0xFF3D7FD4).withOpacity(0.35),
                  blurRadius: 28,
                  spreadRadius: 4,
                ),
              ],
            ),
            child: Container(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: const Color(0xFF5B9BF0).withOpacity(0.5),
                  width: 1.5,
                ),
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
                  errorBuilder: (_, __, ___) => Container(
                    color: const Color(0xFF1A3A80),
                    child: const Center(
                      child: Icon(Icons.directions_bike,
                          color: Colors.white, size: 18),
                    ),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 7),
          RichText(
            text: const TextSpan(
              text: 'Pasada',
              style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.5,
                  color: AppColors.textPrimary),
              children: [
                TextSpan(
                    text: 'Now',
                    style: TextStyle(color: AppColors.orange)),
              ],
            ),
          ),
          const Spacer(),
          _navButton('Sign In', _goToLogin, filled: true),
          const SizedBox(width: 8),
          _navButton('Register', _goToRegister, filled: false),
        ],
      ),
    );
  }

  Widget _navButton(String label, VoidCallback onTap,
      {required bool filled}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 7),
        decoration: BoxDecoration(
          gradient: filled
              ? const LinearGradient(
                  colors: [Color(0xFF2563C8), AppColors.accent])
              : null,
          color: filled ? null : Colors.transparent,
          border: filled ? null : Border.all(color: AppColors.border),
          borderRadius: BorderRadius.circular(20),
          boxShadow: filled
              ? [
                  BoxShadow(
                      color: AppColors.accent.withOpacity(0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 3)),
                ]
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (filled) ...[
              const Icon(Icons.rocket_launch_outlined,
                  size: 11, color: Colors.white),
              const SizedBox(width: 4),
            ],
            Text(
              label,
              style: TextStyle(
                  color: filled ? Colors.white : AppColors.textMuted,
                  fontSize: 11,
                  fontWeight: FontWeight.w700),
            ),
          ],
        ),
      ),
    );
  }

  // ── HERO SECTION ──────────────────────────────────────────────────────────
  Widget _buildHero() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(24, 32, 24, 32),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF040E22), Color(0xFF081730)],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RichText(
            text: const TextSpan(
              style: TextStyle(
                  fontSize: 30,
                  fontWeight: FontWeight.w900,
                  color: AppColors.textPrimary,
                  height: 1.15,
                  letterSpacing: -0.5),
              children: [
                TextSpan(text: 'Book a Tricycle\n'),
                TextSpan(
                    text: 'Instantly.',
                    style: TextStyle(color: AppColors.accentLight)),
              ],
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            'Safe, verified, and regulated tricycle rides at your fingertips — anytime, anywhere.',
            softWrap: true,
            style: TextStyle(
                fontSize: 13,
                color: AppColors.textMuted,
                height: 1.6),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                flex: 3,
                child: _primaryButton(
                  label: 'Book a Ride',
                  icon: Icons.rocket_launch_outlined,
                  onTap: _goToLogin,
                  gradient: const [Color(0xFF2563C8), AppColors.accent],
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                flex: 2,
                child: GestureDetector(
                  onTap: _goToRegister,
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 15),
                    decoration: BoxDecoration(
                      color: AppColors.bgCard,
                      border: Border.all(color: AppColors.border),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Center(
                      child: Text(
                        'Sign Up',
                        style: TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 14,
                            fontWeight: FontWeight.w700),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // ── Google Sign In button (matches login screen) ────────────────
          _buildGoogleSignInButton(),
        ],
      ),
    );
  }

  Widget _primaryButton({
    required String label,
    required IconData icon,
    required VoidCallback onTap,
    required List<Color> gradient,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 15),
        decoration: BoxDecoration(
          gradient: LinearGradient(colors: gradient),
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
                color: gradient.last.withOpacity(0.4),
                blurRadius: 14,
                offset: const Offset(0, 5)),
          ],
        ),
        child: Center(
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 16, color: Colors.white),
              const SizedBox(width: 8),
              Text(
                label,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w700),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── Google button — same style as login_screen ────────────────────────────
  Widget _buildGoogleSignInButton() {
    return GestureDetector(
      onTap: _goToLogin,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 13),
        decoration: BoxDecoration(
          color: const Color(0xFF0D1E3D),
          border: Border.all(color: const Color(0xFF1E3A6E), width: 1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            SizedBox(
              width: 22,
              height: 22,
              child: CustomPaint(painter: _GoogleLogoPainter()),
            ),
            const SizedBox(width: 10),
            const Text(
              'Continue with Google',
              style: TextStyle(
                color: Color(0xFFE8EEF7),
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── HOW IT WORKS ──────────────────────────────────────────────────────────
  Widget _buildHowItWorks() {
    final steps = [
      _Step(
        number: '01',
        icon: Icons.smartphone_rounded,
        iconColor: AppColors.accentLight,
        iconBg: AppColors.accent,
        title: 'Sign Up or Log In',
        desc: 'Download PasadaNow, create an account, or log in to get started.',
      ),
      _Step(
        number: '02',
        icon: Icons.electric_rickshaw_rounded,
        iconColor: AppColors.orange,
        iconBg: AppColors.orange,
        title: 'Book a Ride',
        desc: 'Enter your destination, choose a driver, and confirm your booking.',
      ),
      _Step(
        number: '03',
        icon: Icons.rocket_launch_outlined,
        iconColor: AppColors.green,
        iconBg: AppColors.green,
        title: 'Ride & Track',
        desc: 'Your driver is on the way. Track them in real-time and enjoy a safe trip.',
      ),
    ];

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionHeader(
            label: 'HOW IT WORKS',
            title: 'Ready to ride in\n3 simple steps',
          ),
          const SizedBox(height: 14),
          ...steps.map((s) => _buildStepCard(s)),
        ],
      ),
    );
  }

  Widget _buildStepCard(_Step step) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.bgCard,
        border: Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Text(
            step.number,
            style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w900,
                color: AppColors.accent.withOpacity(0.25),
                letterSpacing: -1),
          ),
          const SizedBox(width: 12),
          // ── Register-style icon container ──────────────────────────────
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: step.iconBg.withOpacity(0.15),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: step.iconBg.withOpacity(0.35),
                width: 1,
              ),
            ),
            child: Center(
              child: Icon(step.icon, color: step.iconColor, size: 24),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(step.title,
                    style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary)),
                const SizedBox(height: 3),
                Text(step.desc,
                    style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.textMuted,
                        height: 1.4)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── FEATURES SECTION ──────────────────────────────────────────────────────
  Widget _buildFeaturesSection() {
    final features = [
      _Feature(
          icon: Icons.bolt_rounded,
          title: 'Instant Booking',
          desc: 'Confirm a ride in seconds.',
          color: AppColors.accent),
      _Feature(
          icon: Icons.location_on_rounded,
          title: 'Live Tracking',
          desc: 'Real-time driver map.',
          color: AppColors.green),
      _Feature(
          icon: Icons.verified_user_outlined,
          title: 'Verified Drivers',
          desc: 'ID-checked and approved.',
          color: AppColors.orange),
      _Feature(
          icon: Icons.credit_card_rounded,
          title: 'Fixed Fares',
          desc: 'No surge, no hidden fees.',
          color: AppColors.accentLight),
      _Feature(
          icon: Icons.star_outline_rounded,
          title: 'Ride Ratings',
          desc: 'Rate every experience.',
          color: AppColors.orange),
      _Feature(
          icon: Icons.shield_outlined,
          title: 'Regulated',
          desc: 'Licensed and franchised.',
          color: AppColors.green),
    ];

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionHeader(
            label: 'WHY PASADANOW',
            title: 'Built for riders\nwho value safety',
          ),
          const SizedBox(height: 14),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              childAspectRatio: 1.6,
            ),
            itemCount: features.length,
            itemBuilder: (_, i) => _buildFeatureCard(features[i]),
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureCard(_Feature f) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.bgCard,
        border: Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // ── Register-style icon container ────────────────────────────
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: f.color.withOpacity(0.15),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: f.color.withOpacity(0.3),
                width: 1,
              ),
            ),
            child: Center(
              child: Icon(f.icon, color: f.color, size: 20),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(f.title,
                    style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary)),
                const SizedBox(height: 3),
                Text(f.desc,
                    style: const TextStyle(
                        fontSize: 10,
                        color: AppColors.textMuted,
                        height: 1.3),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── DRIVER CTA ────────────────────────────────────────────────────────────
  Widget _buildDriverCTA() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF1A2F10), Color(0xFF0E1A08)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          border: Border.all(color: AppColors.green.withOpacity(0.25)),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: AppColors.green.withOpacity(0.12),
                border:
                    Border.all(color: AppColors.green.withOpacity(0.3)),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.electric_rickshaw_rounded,
                      size: 14, color: AppColors.green),
                  const SizedBox(width: 6),
                  const Text(
                    'For Drivers',
                    style: TextStyle(
                        fontSize: 11,
                        color: AppColors.green,
                        fontWeight: FontWeight.w700),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Earn more with\nyour tricycle',
              style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  color: AppColors.textPrimary,
                  height: 1.2),
            ),
            const SizedBox(height: 8),
            const Text(
              'Join the PasadaNow driver network. Get more bookings, manage your schedule, and grow your income.',
              style: TextStyle(
                  fontSize: 12,
                  color: AppColors.textMuted,
                  height: 1.5),
            ),
            const SizedBox(height: 16),
            GestureDetector(
              onTap: _goToRegister,
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 13),
                decoration: BoxDecoration(
                  color: AppColors.green.withOpacity(0.15),
                  border: Border.all(
                      color: AppColors.green.withOpacity(0.4)),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Center(
                  child: Text(
                    'Register as Driver →',
                    style: TextStyle(
                        color: AppColors.green,
                        fontSize: 13,
                        fontWeight: FontWeight.w700),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── SETTINGS LINKS ────────────────────────────────────────────────────────
  Widget _buildSettingsLinks() {
    final links = [
      (Icons.lock_outline_rounded,    AppColors.accentLight, 'Privacy Policy',    Icons.chevron_right_rounded),
      (Icons.description_outlined,    AppColors.accent,      'Terms of Service',  Icons.chevron_right_rounded),
      (Icons.shield_outlined,         AppColors.green,       'Safety Guidelines', Icons.chevron_right_rounded),
    ];

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionHeader(
            label: 'MORE',
            title: 'Legal',
          ),
          const SizedBox(height: 14),
          Container(
            decoration: BoxDecoration(
              color: AppColors.bgCard,
              border: Border.all(color: AppColors.border),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: List.generate(links.length, (i) {
                final isLast = i == links.length - 1;
                return GestureDetector(
                  onTap: () {
                    switch (i) {
                      case 0:
                        SettingsLegalScreen.pushPrivacyPolicy(context);
                        break;
                      case 1:
                        SettingsLegalScreen.pushTerms(context);
                        break;
                      case 2:
                        SettingsLegalScreen.pushSafety(context);
                        break;
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 15),
                    decoration: BoxDecoration(
                      border: isLast
                          ? null
                          : const Border(
                              bottom:
                                  BorderSide(color: AppColors.border)),
                    ),
                    child: Row(
                      children: [
                        // ── Register-style icon container ──────────────
                        Container(
                          width: 38,
                          height: 38,
                          decoration: BoxDecoration(
                            color: links[i].$2.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(11),
                            border: Border.all(
                              color: links[i].$2.withOpacity(0.3),
                              width: 1,
                            ),
                          ),
                          child: Center(
                            child: Icon(links[i].$1,
                                size: 18, color: links[i].$2),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Text(
                            links[i].$3,
                            style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: AppColors.textPrimary),
                          ),
                        ),
                        Icon(links[i].$4,
                            size: 18, color: AppColors.textMuted),
                      ],
                    ),
                  ),
                );
              }),
            ),
          ),
          const SizedBox(height: 20),
          const Center(
            child: Text(
              'PasadaNow © 2025  ·  v1.0.0',
              style: TextStyle(
                  fontSize: 10,
                  color: AppColors.textMuted),
            ),
          ),
        ],
      ),
    );
  }

  // ── HELPERS ───────────────────────────────────────────────────────────────
  Widget _sectionHeader(
      {required String label, required String title}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w700,
                color: AppColors.accentLight,
                letterSpacing: 1.5)),
        const SizedBox(height: 6),
        Text(title,
            style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w900,
                color: AppColors.textPrimary,
                height: 1.2)),
      ],
    );
  }
}

// ── DATA MODELS ───────────────────────────────────────────────────────────────
class _Step {
  final String number, title, desc;
  final IconData icon;
  final Color iconColor;
  final Color iconBg;
  _Step({
    required this.number,
    required this.icon,
    required this.iconColor,
    required this.iconBg,
    required this.title,
    required this.desc,
  });
}

class _Feature {
  final IconData icon;
  final String title, desc;
  final Color color;
  _Feature({
    required this.icon,
    required this.title,
    required this.desc,
    required this.color,
  });
}

// ── GRID PAINTER ──────────────────────────────────────────────────────────────
class _GridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0x221E3A6E)
      ..strokeWidth = 1;
    const step = 36.0;
    for (double x = 0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(_) => false;
}

// ── Google "G" logo painter (same as login_screen.dart) ──────────────────────
class _GoogleLogoPainter extends CustomPainter {
  static const double _pi = 3.1415926535897932;
  static double _rad(double deg) => deg * _pi / 180;

  static const Color _red    = Color(0xFFEA4335);
  static const Color _blue   = Color(0xFF4285F4);
  static const Color _yellow = Color(0xFFFBBC05);
  static const Color _green  = Color(0xFF34A853);

  @override
  void paint(Canvas canvas, Size size) {
    final double cx      = size.width  / 2;
    final double cy      = size.height / 2;
    final double r       = size.width  / 2;
    final Offset  center = Offset(cx, cy);

    final double stroke = r * 0.38;
    final double innerR = r - stroke;
    final double midR   = innerR + stroke / 2;

    void arc(Color color, double startDeg, double sweepDeg) {
      final paint = Paint()
        ..color       = color
        ..style       = PaintingStyle.stroke
        ..strokeWidth = stroke
        ..strokeCap   = StrokeCap.round;
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: midR),
        _rad(startDeg),
        _rad(sweepDeg),
        false,
        paint,
      );
    }

    arc(_red,    -117, 160);
    arc(_yellow,   43,  77);
    arc(_green,   120,  82);
    arc(_blue,    202,  70);

    final double barH     = stroke * 0.82;
    final double barLeft  = cx;
    final double barRight = cx + r + 1;
    final double barTop   = cy - barH / 2;

    canvas.drawRRect(
      RRect.fromRectAndCorners(
        Rect.fromLTRB(barLeft, barTop, barRight, barTop + barH),
        topRight:    Radius.circular(barH / 2),
        bottomRight: Radius.circular(barH / 2),
      ),
      Paint()
        ..color = _blue
        ..style = PaintingStyle.fill,
    );

    canvas.drawCircle(
      center,
      innerR - 1,
      Paint()
        ..color     = Colors.transparent
        ..blendMode = BlendMode.clear,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}