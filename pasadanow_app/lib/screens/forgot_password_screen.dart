import 'package:flutter/material.dart';
import '../core/auth_service.dart';

/// 3-step forgot password flow:
///   Step 1 — Enter email → request OTP
///   Step 2 — Enter 6-digit OTP
///   Step 3 — Enter & confirm new password
class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen>
    with SingleTickerProviderStateMixin {
  // ── Steps ──────────────────────────────────────────────────────────────────
  int _step = 1; // 1 = email, 2 = otp, 3 = new password

  // ── Controllers ────────────────────────────────────────────────────────────
  final _emailCtrl = TextEditingController();
  final _otpCtrl = TextEditingController();
  final _newPassCtrl = TextEditingController();
  final _confPassCtrl = TextEditingController();

  // ── State ──────────────────────────────────────────────────────────────────
  bool _loading = false;
  bool _obscureNew = true;
  bool _obscureConf = true;
  String? _emailError;
  String? _otpError;
  String? _passError;
  String? _confPassError;

  final _authService = AuthService();

  // ── Animation ──────────────────────────────────────────────────────────────
  late AnimationController _animCtrl;
  late Animation<double> _fadeAnim;
  late Animation<Offset> _slideAnim;

  // ── Colors (match LoginScreen palette) ────────────────────────────────────
  static const Color _bgDeep = Color(0xFF0B1B35);
  static const Color _bgCard = Color(0xFF102245);
  static const Color _accent = Color(0xFF3D7FD4);
  static const Color _accentLight = Color(0xFF5B9BF0);
  static const Color _errorRed = Color(0xFFE05555);
  static const Color _successGreen = Color(0xFF34C77B);
  static const Color _textPrimary = Color(0xFFE8EEF7);
  static const Color _textMuted = Color(0xFF8A9BC0);
  static const Color _borderDefault = Color(0xFF1E3A6E);
  static const Color _inputBg = Color(0xFF0D1E3D);

  @override
  void initState() {
    super.initState();
    _animCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _fadeAnim = CurvedAnimation(parent: _animCtrl, curve: Curves.easeOut);
    _slideAnim = Tween<Offset>(
      begin: const Offset(0, 0.06),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _animCtrl, curve: Curves.easeOut));
    _animCtrl.forward();
  }

  @override
  void dispose() {
    _animCtrl.dispose();
    _emailCtrl.dispose();
    _otpCtrl.dispose();
    _newPassCtrl.dispose();
    _confPassCtrl.dispose();
    super.dispose();
  }

  // ── Step 1 — Send OTP ─────────────────────────────────────────────────────
  Future<void> _sendOtp() async {
    final email = _emailCtrl.text.trim();
    if (email.isEmpty || !email.contains('@')) {
      setState(() => _emailError = 'Please enter a valid email address.');
      return;
    }
    setState(() {
      _loading = true;
      _emailError = null;
    });
    try {
      await _authService.forgotPassword(email);
      _nextStep();
    } on AuthException catch (e) {
      _showSnack(e.message);
    } catch (_) {
      _showSnack('Something went wrong. Please try again.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  // ── Step 2 — Verify OTP ───────────────────────────────────────────────────
  // Must be Future<void> to match _primaryButton's onPressed type
  Future<void> _verifyOtp() async {
    final otp = _otpCtrl.text.trim();
    if (otp.length != 6 || int.tryParse(otp) == null) {
      setState(() => _otpError = 'Please enter the 6-digit OTP.');
      return;
    }
    setState(() => _otpError = null);
    _nextStep();
  }

  // ── Step 3 — Reset Password ───────────────────────────────────────────────
  Future<void> _resetPassword() async {
    final newPass = _newPassCtrl.text;
    final confPass = _confPassCtrl.text;

    setState(() {
      _passError =
          newPass.length < 6 ? 'Password must be at least 6 characters.' : null;
      _confPassError = newPass != confPass ? 'Passwords do not match.' : null;
    });
    if (_passError != null || _confPassError != null) return;

    setState(() => _loading = true);
    try {
      await _authService.resetPassword(
        email: _emailCtrl.text.trim(),
        otp: _otpCtrl.text.trim(),
        newPassword: newPass,
      );
      if (!mounted) return;
      _showSnack('Password reset successfully!', isSuccess: true);
      await Future.delayed(const Duration(milliseconds: 1200));
      if (mounted) Navigator.of(context).pop();
    } on AuthException catch (e) {
      _showSnack(e.message);
      if (e.message.toLowerCase().contains('otp')) {
        setState(() => _step = 2);
      }
    } catch (_) {
      _showSnack('Something went wrong. Please try again.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _nextStep() {
    setState(() => _step++);
    _animCtrl
      ..reset()
      ..forward();
  }

  void _prevStep() {
    if (_step > 1) {
      setState(() => _step--);
      _animCtrl
        ..reset()
        ..forward();
    } else {
      Navigator.of(context).pop();
    }
  }

  void _showSnack(String msg, {bool isSuccess = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: isSuccess ? _successGreen : _errorRed,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    ));
  }

  // ── Build ──────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bgDeep,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded,
              color: _textPrimary, size: 20),
          onPressed: _loading ? null : _prevStep,
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
          child: FadeTransition(
            opacity: _fadeAnim,
            child: SlideTransition(
              position: _slideAnim,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 8),
                  _buildHeader(),
                  const SizedBox(height: 32),
                  _buildProgressIndicator(),
                  const SizedBox(height: 28),
                  Container(
                    decoration: BoxDecoration(
                      color: _bgCard,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: _borderDefault),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.3),
                          blurRadius: 20,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    padding: const EdgeInsets.all(24),
                    child: _buildStepContent(),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  // ── Header ─────────────────────────────────────────────────────────────────
  Widget _buildHeader() {
    final titles = [
      'Forgot Password?',
      'Check Your Email',
      'New Password',
    ];
    final subtitles = [
      'Enter the email linked to your account\nand we\'ll send you a reset code.',
      'Enter the 6-digit OTP sent to\n${_emailCtrl.text.trim()}',
      'Choose a strong new password\nfor your account.',
    ];
    final icons = [
      Icons.lock_reset_rounded,
      Icons.mark_email_read_outlined,
      Icons.vpn_key_rounded,
    ];

    return Column(
      children: [
        Container(
          width: 70,
          height: 70,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: const LinearGradient(
              colors: [Color(0xFF2A5FC0), Color(0xFF0D1E3D)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            border: Border.all(color: _accentLight.withOpacity(0.4), width: 2),
            boxShadow: [
              BoxShadow(
                color: _accentLight.withOpacity(0.35),
                blurRadius: 20,
                spreadRadius: 3,
              ),
            ],
          ),
          child: Icon(icons[_step - 1], color: _accentLight, size: 30),
        ),
        const SizedBox(height: 16),
        Text(
          titles[_step - 1],
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w800,
            color: _textPrimary,
            letterSpacing: -0.3,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          subtitles[_step - 1],
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 13, color: _textMuted, height: 1.5),
        ),
      ],
    );
  }

  // ── Progress dots ──────────────────────────────────────────────────────────
  Widget _buildProgressIndicator() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(3, (i) {
        final active = i + 1 == _step;
        final completed = i + 1 < _step;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          margin: const EdgeInsets.symmetric(horizontal: 4),
          width: active ? 28 : 10,
          height: 10,
          decoration: BoxDecoration(
            color: completed
                ? _successGreen
                : active
                    ? _accentLight
                    : _borderDefault,
            borderRadius: BorderRadius.circular(5),
          ),
          child: completed
              ? const Icon(Icons.check, size: 7, color: Colors.white)
              : null,
        );
      }),
    );
  }

  // ── Step content ───────────────────────────────────────────────────────────
  Widget _buildStepContent() {
    return switch (_step) {
      1 => _buildStep1(),
      2 => _buildStep2(),
      3 => _buildStep3(),
      _ => const SizedBox(),
    };
  }

  // ── Step 1: Email input ────────────────────────────────────────────────────
  Widget _buildStep1() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _label(Icons.email_outlined, 'Email Address'),
        const SizedBox(height: 6),
        _inputField(
          controller: _emailCtrl,
          hint: 'Enter your registered email',
          icon: Icons.email_outlined,
          keyboardType: TextInputType.emailAddress,
          hasError: _emailError != null,
          onChanged: (_) => setState(() => _emailError = null),
        ),
        if (_emailError != null) ...[
          const SizedBox(height: 5),
          _errorText(_emailError!),
        ],
        const SizedBox(height: 28),
        _primaryButton(
          label: 'Send OTP',
          icon: Icons.send_rounded,
          onPressed: _sendOtp,
        ),
      ],
    );
  }

  // ── Step 2: OTP input ──────────────────────────────────────────────────────
  Widget _buildStep2() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _label(Icons.password_rounded, '6-Digit OTP'),
        const SizedBox(height: 6),
        _inputField(
          controller: _otpCtrl,
          hint: 'Enter the OTP from your email',
          icon: Icons.password_rounded,
          keyboardType: TextInputType.number,
          maxLength: 6,
          hasError: _otpError != null,
          onChanged: (_) => setState(() => _otpError = null),
        ),
        if (_otpError != null) ...[
          const SizedBox(height: 5),
          _errorText(_otpError!),
        ],
        const SizedBox(height: 12),
        Center(
          child: GestureDetector(
            onTap: _loading ? null : _sendOtp,
            child: const Text(
              'Resend OTP',
              style: TextStyle(
                fontSize: 13,
                color: _accentLight,
                fontWeight: FontWeight.w600,
                decoration: TextDecoration.underline,
                decorationColor: _accentLight,
              ),
            ),
          ),
        ),
        const SizedBox(height: 28),
        _primaryButton(
          label: 'Verify OTP',
          icon: Icons.verified_outlined,
          onPressed: _verifyOtp, // ✅ now Future<void>
        ),
      ],
    );
  }

  // ── Step 3: New password ───────────────────────────────────────────────────
  Widget _buildStep3() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _label(Icons.lock_outline_rounded, 'New Password'),
        const SizedBox(height: 6),
        _passwordField(
          controller: _newPassCtrl,
          hint: 'Enter new password',
          obscure: _obscureNew,
          hasError: _passError != null,
          onToggle: () => setState(() => _obscureNew = !_obscureNew),
          onChanged: (_) => setState(() => _passError = null),
        ),
        if (_passError != null) ...[
          const SizedBox(height: 5),
          _errorText(_passError!),
        ],
        const SizedBox(height: 18),
        _label(Icons.lock_person_outlined, 'Confirm Password'),
        const SizedBox(height: 6),
        _passwordField(
          controller: _confPassCtrl,
          hint: 'Re-enter new password',
          obscure: _obscureConf,
          hasError: _confPassError != null,
          onToggle: () => setState(() => _obscureConf = !_obscureConf),
          onChanged: (_) => setState(() => _confPassError = null),
        ),
        if (_confPassError != null) ...[
          const SizedBox(height: 5),
          _errorText(_confPassError!),
        ],
        const SizedBox(height: 28),
        _primaryButton(
          label: 'Reset Password',
          icon: Icons.check_circle_outline_rounded,
          onPressed: _resetPassword,
        ),
      ],
    );
  }

  // ── Widget helpers ─────────────────────────────────────────────────────────

  Widget _label(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 15, color: _textPrimary),
        const SizedBox(width: 6),
        Text(text,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: _textPrimary,
            )),
      ],
    );
  }

  Widget _inputField({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    required bool hasError,
    TextInputType keyboardType = TextInputType.text,
    int? maxLength,
    void Function(String)? onChanged,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: _inputBg,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: hasError ? _errorRed : _borderDefault,
          width: 1.2,
        ),
      ),
      child: TextField(
        controller: controller,
        keyboardType: keyboardType,
        maxLength: maxLength,
        onChanged: onChanged,
        style: const TextStyle(color: _textPrimary, fontSize: 14),
        cursorColor: _accentLight,
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: _textMuted, fontSize: 14),
          prefixIcon: Icon(icon, size: 20, color: _textMuted),
          border: InputBorder.none,
          counterText: '',
          contentPadding:
              const EdgeInsets.symmetric(vertical: 14, horizontal: 4),
          isDense: true,
        ),
      ),
    );
  }

  Widget _passwordField({
    required TextEditingController controller,
    required String hint,
    required bool obscure,
    required bool hasError,
    required VoidCallback onToggle,
    void Function(String)? onChanged,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: _inputBg,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: hasError ? _errorRed : _borderDefault,
          width: 1.2,
        ),
      ),
      child: TextField(
        controller: controller,
        obscureText: obscure,
        onChanged: onChanged,
        style: const TextStyle(color: _textPrimary, fontSize: 14),
        cursorColor: _accentLight,
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: _textMuted, fontSize: 14),
          prefixIcon: const Icon(Icons.lock_outline_rounded,
              size: 20, color: _textMuted),
          suffixIcon: GestureDetector(
            onTap: onToggle,
            child: Icon(
              obscure
                  ? Icons.visibility_off_outlined
                  : Icons.visibility_outlined,
              size: 20,
              color: _textMuted,
            ),
          ),
          border: InputBorder.none,
          contentPadding:
              const EdgeInsets.symmetric(vertical: 14, horizontal: 4),
          isDense: true,
        ),
      ),
    );
  }

  Widget _errorText(String msg) {
    return Row(
      children: [
        const Icon(Icons.error_outline_rounded, size: 14, color: _errorRed),
        const SizedBox(width: 5),
        Text(msg, style: const TextStyle(color: _errorRed, fontSize: 12)),
      ],
    );
  }

  Widget _primaryButton({
    required String label,
    required IconData icon,
    required Future<void> Function() onPressed,
  }) {
    return Container(
      height: 50,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        gradient: const LinearGradient(
          colors: [Color(0xFF2563C8), Color(0xFF3D7FD4)],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        boxShadow: [
          BoxShadow(
            color: _accent.withOpacity(0.4),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ElevatedButton(
        onPressed: _loading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          foregroundColor: Colors.white,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          padding: EdgeInsets.zero,
        ),
        child: _loading
            ? const SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(
                    color: Colors.white, strokeWidth: 2.5),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(icon, size: 18, color: Colors.white),
                  const SizedBox(width: 8),
                  Text(
                    label,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.4,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
