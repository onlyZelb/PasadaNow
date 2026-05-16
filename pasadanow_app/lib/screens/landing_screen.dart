import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import 'home_screen.dart';
import 'login_screen.dart';

class LandingScreen extends StatefulWidget {
  const LandingScreen({super.key});

  @override
  State<LandingScreen> createState() => _LandingScreenState();
}

class _LandingScreenState extends State<LandingScreen>
    with TickerProviderStateMixin {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  late AnimationController _bgAnim;
  late AnimationController _pulseAnim;
  late AnimationController _floatAnim;
  late AnimationController _entryAnim;

  late Animation<double> _fadeIn;
  late Animation<Offset> _slideUp;
  late Animation<double> _pulse;
  late Animation<double> _float;
  late Animation<double> _bgRotate;

  static const _pages = [
    _OnboardPage(
      emoji: '🛺',
      tag: 'FOR COMMUTERS',
      tagColor: Color(0xFF38BDF8),
      title: 'Your Ride,\nOn Demand.',
      subtitle:
          'Tap once. A verified driver heads your way. No queues, no guessing — just go.',
      accent: Color(0xFF0EA5E9),
      accentGlow: Color(0xFF38BDF8),
      bgFrom: Color(0xFF060E1F),
      bgTo: Color(0xFF0C2A4A),
    ),
    _OnboardPage(
      emoji: '💰',
      tag: 'FOR DRIVERS',
      tagColor: Color(0xFFFB923C),
      title: 'Earn More.\nDrive Smart.',
      subtitle:
          'More bookings flow directly to you. Track every peso earned — live on your dashboard.',
      accent: Color(0xFFEA580C),
      accentGlow: Color(0xFFFB923C),
      bgFrom: Color(0xFF150800),
      bgTo: Color(0xFF2D1500),
    ),
    _OnboardPage(
      emoji: '🔐',
      tag: 'ALWAYS SAFE',
      tagColor: Color(0xFF4ADE80),
      title: 'Trusted by\nThousands.',
      subtitle:
          'Verified drivers. Fixed fares. Live tracking. Ratings after every ride. Safety built in.',
      accent: Color(0xFF16A34A),
      accentGlow: Color(0xFF4ADE80),
      bgFrom: Color(0xFF021208),
      bgTo: Color(0xFF0A2A18),
    ),
  ];

  @override
  void initState() {
    super.initState();

    _bgAnim = AnimationController(
        vsync: this, duration: const Duration(seconds: 14))
      ..repeat();
    _bgRotate =
        Tween<double>(begin: 0, end: 2 * math.pi).animate(_bgAnim);

    _pulseAnim = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 1900))
      ..repeat(reverse: true);
    _pulse = Tween<double>(begin: 0.93, end: 1.07).animate(
        CurvedAnimation(parent: _pulseAnim, curve: Curves.easeInOut));

    _floatAnim = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 2600))
      ..repeat(reverse: true);
    _float = Tween<double>(begin: -8.0, end: 8.0).animate(
        CurvedAnimation(parent: _floatAnim, curve: Curves.easeInOut));

    _entryAnim = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 800));
    _fadeIn =
        CurvedAnimation(parent: _entryAnim, curve: Curves.easeOut);
    _slideUp = Tween<Offset>(
            begin: const Offset(0, 0.12), end: Offset.zero)
        .animate(
            CurvedAnimation(parent: _entryAnim, curve: Curves.easeOut));
    _entryAnim.forward();
  }

  @override
  void dispose() {
    _bgAnim.dispose();
    _pulseAnim.dispose();
    _floatAnim.dispose();
    _entryAnim.dispose();
    _pageController.dispose();
    super.dispose();
  }

  void _goToHome() {
    Navigator.pushReplacement(
        context, MaterialPageRoute(builder: (_) => const HomeScreen()));
  }

  void _nextPage() {
    if (_currentPage < _pages.length - 1) {
      _pageController.nextPage(
          duration: const Duration(milliseconds: 420),
          curve: Curves.easeInOutCubic);
    } else {
      _goToHome();
    }
  }

  @override
  Widget build(BuildContext context) {
    final page = _pages[_currentPage];

    return Scaffold(
      body: AnimatedContainer(
        duration: const Duration(milliseconds: 500),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [page.bgFrom, page.bgTo],
          ),
        ),
        child: Stack(
          children: [
            _buildAtmosphere(page),
            FadeTransition(
              opacity: _fadeIn,
              child: SlideTransition(
                position: _slideUp,
                child: SafeArea(
                  child: Column(
                    children: [
                      _buildTopBar(page),
                      Expanded(
                        child: PageView.builder(
                          controller: _pageController,
                          itemCount: _pages.length,
                          onPageChanged: (i) =>
                              setState(() => _currentPage = i),
                          itemBuilder: (_, i) =>
                              _buildPage(_pages[i]),
                        ),
                      ),
                      _buildBottomBar(page),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── ATMOSPHERE ─────────────────────────────────────────────────────────────
  Widget _buildAtmosphere(_OnboardPage page) {
    return AnimatedBuilder(
      animation: _bgRotate,
      builder: (_, __) => Stack(
        children: [
          Positioned(
            top: -100,
            right: -80,
            child: Transform.rotate(
              angle: _bgRotate.value * 0.25,
              child: Container(
                width: 320,
                height: 320,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(colors: [
                    page.accentGlow.withOpacity(0.2),
                    page.accentGlow.withOpacity(0.04),
                    Colors.transparent,
                  ]),
                ),
              ),
            ),
          ),
          Positioned(
            bottom: 80,
            left: -100,
            child: Transform.rotate(
              angle: -_bgRotate.value * 0.18,
              child: Container(
                width: 250,
                height: 250,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(colors: [
                    page.accent.withOpacity(0.15),
                    Colors.transparent,
                  ]),
                ),
              ),
            ),
          ),
          Opacity(
            opacity: 0.035,
            child: CustomPaint(
              size: Size(MediaQuery.of(context).size.width,
                  MediaQuery.of(context).size.height),
              painter: _DotGridPainter(),
            ),
          ),
        ],
      ),
    );
  }

  // ── TOP BAR ────────────────────────────────────────────────────────────────
  Widget _buildTopBar(_OnboardPage page) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
      child: Row(
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                  colors: [page.accent.withOpacity(0.9), page.bgFrom],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight),
              border: Border.all(
                  color: page.accentGlow.withOpacity(0.5), width: 1.5),
              boxShadow: [
                BoxShadow(
                    color: page.accentGlow.withOpacity(0.4),
                    blurRadius: 14,
                    spreadRadius: 2),
              ],
            ),
            child: Image.asset(
              'assets/logo.png',
              width: 34,
              height: 34,
              fit: BoxFit.contain,
            ),
          ),
          const SizedBox(width: 10),
          RichText(
            text: const TextSpan(
              text: 'Pasada',
              style: TextStyle(
                  fontSize: 19,
                  fontWeight: FontWeight.w900,
                  color: Colors.white,
                  letterSpacing: -0.5),
              children: [
                TextSpan(
                    text: 'Now',
                    style: TextStyle(color: Color(0xFFFB923C))),
              ],
            ),
          ),
          const Spacer(),
          GestureDetector(
            onTap: _goToHome,
            child: Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.07),
                border:
                    Border.all(color: Colors.white.withOpacity(0.12)),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Text('Skip',
                  style: TextStyle(
                      color: Colors.white54,
                      fontSize: 13,
                      fontWeight: FontWeight.w600)),
            ),
          ),
        ],
      ),
    );
  }

  // ── PAGE ──────────────────────────────────────────────────────────────────
  Widget _buildPage(_OnboardPage page) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 26),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // ── Floating emoji orb
          AnimatedBuilder(
            animation: Listenable.merge([_float, _pulse]),
            builder: (_, __) => Transform.translate(
              offset: Offset(0, _float.value),
              child: Transform.scale(
                scale: _pulse.value,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    // Outer diffuse glow
                    Container(
                      width: 170,
                      height: 170,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: RadialGradient(colors: [
                          page.accentGlow.withOpacity(0.25),
                          page.accent.withOpacity(0.06),
                          Colors.transparent,
                        ]),
                      ),
                    ),
                    // Ring 2
                    Container(
                      width: 130,
                      height: 130,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: page.accent.withOpacity(0.08),
                        border: Border.all(
                            color: page.accentGlow.withOpacity(0.25),
                            width: 1),
                      ),
                    ),
                    // Inner glowing circle
                    Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: RadialGradient(
                          colors: [
                            page.accent.withOpacity(0.22),
                            page.accent.withOpacity(0.06),
                          ],
                        ),
                        border: Border.all(
                            color: page.accentGlow.withOpacity(0.45),
                            width: 1.5),
                        boxShadow: [
                          BoxShadow(
                              color: page.accentGlow.withOpacity(0.5),
                              blurRadius: 28,
                              spreadRadius: 3),
                        ],
                      ),
                      child: Center(
                        child: Text(page.emoji,
                            style: const TextStyle(fontSize: 48)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          const SizedBox(height: 32),

          // ── Audience tag
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 13, vertical: 5),
            decoration: BoxDecoration(
              color: page.tagColor.withOpacity(0.1),
              border:
                  Border.all(color: page.tagColor.withOpacity(0.35)),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 6,
                  height: 6,
                  decoration: BoxDecoration(
                    color: page.tagColor,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                          color: page.tagColor.withOpacity(0.8),
                          blurRadius: 6)
                    ],
                  ),
                ),
                const SizedBox(width: 7),
                Text(page.tag,
                    style: TextStyle(
                        color: page.tagColor,
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.8)),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // ── Title
          Text(
            page.title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 38,
              fontWeight: FontWeight.w900,
              color: Colors.white,
              height: 1.06,
              letterSpacing: -1.5,
            ),
          ),

          const SizedBox(height: 14),

          // ── Subtitle
          Text(
            page.subtitle,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              color: Colors.white.withOpacity(0.55),
              height: 1.7,
            ),
          ),
        ],
      ),
    );
  }

  // ── BOTTOM BAR ─────────────────────────────────────────────────────────────
  Widget _buildBottomBar(_OnboardPage page) {
    final isLast = _currentPage == _pages.length - 1;

    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 36),
      child: Column(
        children: [
          // Dots
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(_pages.length, (i) {
              final active = i == _currentPage;
              return AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                curve: Curves.easeInOut,
                margin: const EdgeInsets.symmetric(horizontal: 4),
                width: active ? 28 : 8,
                height: 8,
                decoration: BoxDecoration(
                  color: active
                      ? page.accentGlow
                      : Colors.white.withOpacity(0.18),
                  borderRadius: BorderRadius.circular(4),
                  boxShadow: active
                      ? [
                          BoxShadow(
                              color: page.accentGlow.withOpacity(0.6),
                              blurRadius: 8)
                        ]
                      : null,
                ),
              );
            }),
          ),
          const SizedBox(height: 22),

          // Primary CTA
          GestureDetector(
            onTap: _nextPage,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 350),
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 17),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [page.accent, page.accentGlow],
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                ),
                borderRadius: BorderRadius.circular(18),
                boxShadow: [
                  BoxShadow(
                      color: page.accentGlow.withOpacity(0.5),
                      blurRadius: 28,
                      offset: const Offset(0, 8)),
                  BoxShadow(
                      color: page.accentGlow.withOpacity(0.15),
                      blurRadius: 60,
                      offset: const Offset(0, 16)),
                ],
              ),
              child: Center(
                child: Text(
                  isLast ? '🚀  Get Started' : 'Next  →',
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.3),
                ),
              ),
            ),
          ),
          const SizedBox(height: 14),

          // Sign in row
          GestureDetector(
            onTap: _goToHome,
            child: RichText(
              text: TextSpan(
                style: TextStyle(
                    fontSize: 13,
                    color: Colors.white.withOpacity(0.4)),
                children: [
                  const TextSpan(text: 'Already have an account?  '),
                  TextSpan(
                    text: 'Sign In',
                    style: TextStyle(
                        color: page.accentGlow,
                        fontWeight: FontWeight.w700),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── DATA MODEL ────────────────────────────────────────────────────────────────
class _OnboardPage {
  final String emoji;
  final String tag;
  final Color tagColor;
  final String title;
  final String subtitle;
  final Color accent;
  final Color accentGlow;
  final Color bgFrom;
  final Color bgTo;

  const _OnboardPage({
    required this.emoji,
    required this.tag,
    required this.tagColor,
    required this.title,
    required this.subtitle,
    required this.accent,
    required this.accentGlow,
    required this.bgFrom,
    required this.bgTo,
  });
}

// ── DOT GRID PAINTER ──────────────────────────────────────────────────────────
class _DotGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;
    const spacing = 26.0;
    for (double x = 0; x < size.width; x += spacing) {
      for (double y = 0; y < size.height; y += spacing) {
        canvas.drawCircle(Offset(x, y), 1.2, paint);
      }
    }
  }

  @override
  bool shouldRepaint(_) => false;
}