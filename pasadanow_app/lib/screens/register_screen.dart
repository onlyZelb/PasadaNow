import 'dart:convert';
import 'dart:typed_data';
import 'dart:math' as math;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../core/auth_service.dart';
import 'login_screen.dart';

// ── Tricycle SVG Icon ─────────────────────────────────────────────────────────
class TricycleIcon extends StatelessWidget {
  final double size;
  final Color color;
  const TricycleIcon({super.key, this.size = 24, this.color = const Color(0xFFE8863A)});

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: Size(size, size),
      painter: _TricyclePainter(color: color),
    );
  }
}

class _TricyclePainter extends CustomPainter {
  final Color color;
  _TricyclePainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final double s = size.width / 24;
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.8 * s
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    canvas.drawCircle(Offset(5 * s, 17 * s), 2.5 * s, paint);
    canvas.drawCircle(Offset(17 * s, 17 * s), 2.5 * s, paint);

    final body = Path();
    body.moveTo(5 * s, 17 * s);
    body.lineTo(3 * s, 17 * s);
    body.lineTo(3 * s, 9 * s);
    body.relativeLineTo(4 * s, -4 * s);
    body.relativeLineTo(7 * s, 0);
    body.relativeLineTo(3 * s, 5 * s);
    body.relativeLineTo(2 * s, 1 * s);
    body.relativeLineTo(0, 6 * s);
    body.relativeLineTo(-2 * s, 0);
    canvas.drawPath(body, paint);

    final roof = Path();
    roof.moveTo(9 * s, 5 * s);
    roof.lineTo(9 * s, 11 * s);
    roof.lineTo(17 * s, 11 * s);
    canvas.drawPath(roof, paint);
  }

  @override
  bool shouldRepaint(_TricyclePainter old) => old.color != color;
}

// ── Terms & Conditions Modal ──────────────────────────────────────────────────
class TermsAndConditionsModal extends StatelessWidget {
  const TermsAndConditionsModal({super.key});

  static const Color _bgDeep   = Color(0xFF0B1B35);
  static const Color _bgCard   = Color(0xFF102245);
  static const Color _accent   = Color(0xFF3D7FD4);
  static const Color _accentLight = Color(0xFF5B9BF0);
  static const Color _orange   = Color(0xFFE8863A);
  static const Color _border   = Color(0xFF1E3A6E);
  static const Color _textPrimary = Color(0xFFE8EEF7);
  static const Color _textMuted   = Color(0xFF8A9BC0);

  static void show(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const TermsAndConditionsModal(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.88,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (context, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: _bgCard,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              // ── Handle bar ────────────────────────────────────────────
              const SizedBox(height: 12),
              Container(
                width: 40, height: 4,
                decoration: BoxDecoration(
                  color: _border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),
              // ── Header ───────────────────────────────────────────────
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: _accent.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.description_outlined,
                          color: _accentLight, size: 20),
                    ),
                    const SizedBox(width: 12),
                    const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Terms & Conditions',
                          style: TextStyle(
                            color: _textPrimary,
                            fontSize: 17,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        Text(
                          'PasadaNow Tricycle Ride Hailing System',
                          style: TextStyle(color: _textMuted, fontSize: 11),
                        ),
                      ],
                    ),
                    const Spacer(),
                    GestureDetector(
                      onTap: () => Navigator.pop(context),
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: _border.withOpacity(0.5),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.close_rounded,
                            color: _textMuted, size: 18),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Divider(color: _border, thickness: 1, height: 1),
              // ── Scrollable content ────────────────────────────────────
              Expanded(
                child: ListView(
                  controller: scrollController,
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
                  children: [
                    _buildEffectiveDate(),
                    const SizedBox(height: 20),
                    _buildSection(
                      number: '1',
                      title: 'Acceptance of Terms',
                      content:
                          'By creating an account and using PasadaNow, you agree to be bound by '
                          'these Terms and Conditions. If you do not agree to these terms, please '
                          'do not use our services. We reserve the right to update these terms at '
                          'any time, and continued use of the app constitutes acceptance of any changes.',
                    ),
                    _buildSection(
                      number: '2',
                      title: 'User Eligibility',
                      content:
                          'You must be at least 18 years of age to use PasadaNow. By registering, '
                          'you confirm that all information you provide is accurate and truthful. '
                          'Commuters may use the platform to book rides; drivers must complete '
                          'verification before accepting bookings.',
                    ),
                    _buildSection(
                      number: '3',
                      title: 'Account Registration & Security',
                      bullets: [
                        'You are responsible for maintaining the confidentiality of your account credentials.',
                        'Do not share your username or password with any other person.',
                        'You are liable for all activities that occur under your account.',
                        'Notify us immediately of any unauthorized use of your account.',
                        'One person may only hold one active account at a time.',
                      ],
                    ),
                    _buildSection(
                      number: '4',
                      title: 'Driver Verification & Requirements',
                      content:
                          'All driver accounts are subject to admin verification before activation. '
                          'Drivers must provide valid and current documentation including a '
                          'government-issued driver\'s license, vehicle plate photo, and TODA '
                          'clearance. Submitting fraudulent documents will result in permanent '
                          'account termination and may be subject to legal action.',
                    ),
                    _buildSection(
                      number: '5',
                      title: 'Prohibited Conduct',
                      bullets: [
                        'Using the platform for any unlawful purpose.',
                        'Harassing, threatening, or discriminating against other users.',
                        'Providing false personal or vehicle information.',
                        'Manipulating fares or circumventing the platform\'s payment system.',
                        'Operating a vehicle without a valid license or clearance.',
                        'Using multiple accounts to abuse promotions or the rating system.',
                      ],
                    ),
                    _buildSection(
                      number: '6',
                      title: 'Privacy & Data Collection',
                      content:
                          'PasadaNow collects personal information including your name, contact '
                          'details, location data, and uploaded documents solely to provide and '
                          'improve our services. We do not sell your personal data to third parties. '
                          'Location data is used only during active ride sessions. By registering, '
                          'you consent to the collection and use of your data as described in our '
                          'Privacy Policy.',
                    ),
                    _buildSection(
                      number: '7',
                      title: 'Fare & Payment Policy',
                      content:
                          'Fares are calculated based on distance and applicable TODA rates. '
                          'PasadaNow reserves the right to adjust fare structures with prior notice. '
                          'Commuters agree to pay the quoted fare for completed trips. Disputes '
                          'regarding fares must be raised within 24 hours of the completed ride.',
                    ),
                    _buildSection(
                      number: '8',
                      title: 'Ride Safety & Conduct',
                      bullets: [
                        'Drivers must follow all traffic laws and safety regulations.',
                        'Commuters must wear a helmet where required by local ordinance.',
                        'Both parties must treat each other with respect and courtesy.',
                        'PasadaNow is not liable for accidents caused by driver negligence or '
                            'commuter misconduct.',
                        'Dangerous or reckless driving may result in immediate account suspension.',
                      ],
                    ),
                    _buildSection(
                      number: '9',
                      title: 'Ratings & Reviews',
                      content:
                          'Both commuters and drivers may rate each other after a completed ride. '
                          'Ratings must be honest and based on actual ride experience. Abuse of '
                          'the rating system, including retaliatory or fraudulent ratings, '
                          'may result in account penalties.',
                    ),
                    _buildSection(
                      number: '10',
                      title: 'Account Suspension & Termination',
                      content:
                          'PasadaNow reserves the right to suspend or permanently terminate any '
                          'account that violates these Terms and Conditions, engages in fraudulent '
                          'activity, or poses a risk to other users. Users who believe their account '
                          'was suspended in error may appeal through our support channel.',
                    ),
                    _buildSection(
                      number: '11',
                      title: 'Limitation of Liability',
                      content:
                          'PasadaNow acts as a platform connecting commuters and drivers and is '
                          'not a transportation provider. We are not liable for personal injury, '
                          'property damage, or loss arising from rides booked through the platform. '
                          'Our maximum liability to any user shall not exceed the fare paid for the '
                          'disputed trip.',
                    ),
                    _buildSection(
                      number: '12',
                      title: 'Governing Law',
                      content:
                          'These Terms and Conditions are governed by the laws of the Republic of '
                          'the Philippines. Any disputes arising from the use of PasadaNow shall be '
                          'subject to the exclusive jurisdiction of the courts of the Philippines.',
                    ),
                    _buildSection(
                      number: '13',
                      title: 'Contact & Support',
                      content:
                          'For questions, concerns, or support regarding these terms or your account, '
                          'please contact us through the in-app support feature or reach out to '
                          'our team at support@pasadanow.ph.',
                    ),
                    const SizedBox(height: 24),
                    _buildFooterNote(),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
              // ── Accept button ─────────────────────────────────────────
              Container(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
                decoration: BoxDecoration(
                  color: _bgCard,
                  border: Border(top: BorderSide(color: _border, width: 1)),
                ),
                child: SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _accent,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.check_circle_outline_rounded,
                            size: 18, color: Colors.white),
                        SizedBox(width: 8),
                        Text('I Understand',
                            style: TextStyle(
                                fontSize: 15, fontWeight: FontWeight.w700)),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildEffectiveDate() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: _accent.withOpacity(0.08),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: _accent.withOpacity(0.25), width: 1),
      ),
      child: Row(
        children: const [
          Icon(Icons.info_outline_rounded, color: _accentLight, size: 15),
          SizedBox(width: 8),
          Expanded(
            child: Text(
              'Please read these terms carefully before registering. '
              'By tapping "I Understand", you confirm you have read and accepted these conditions.',
              style: TextStyle(color: _accentLight, fontSize: 11.5, height: 1.5),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSection({
    required String number,
    required String title,
    String? content,
    List<String>? bullets,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 26,
                height: 26,
                decoration: BoxDecoration(
                  color: _accent.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Center(
                  child: Text(
                    number,
                    style: const TextStyle(
                      color: _accentLight,
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    color: _textPrimary,
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    height: 1.6,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (content != null)
            Padding(
              padding: const EdgeInsets.only(left: 36),
              child: Text(
                content,
                style: const TextStyle(
                  color: _textMuted,
                  fontSize: 13,
                  height: 1.6,
                ),
              ),
            ),
          if (bullets != null)
            Padding(
              padding: const EdgeInsets.only(left: 36),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: bullets
                    .map(
                      (b) => Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Padding(
                              padding: EdgeInsets.only(top: 6),
                              child: Icon(Icons.circle,
                                  size: 5, color: _accentLight),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                b,
                                style: const TextStyle(
                                  color: _textMuted,
                                  fontSize: 13,
                                  height: 1.6,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                    .toList(),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildFooterNote() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: _orange.withOpacity(0.08),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: _orange.withOpacity(0.25), width: 1),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: const [
          Icon(Icons.gavel_rounded, color: _orange, size: 15),
          SizedBox(width: 8),
          Expanded(
            child: Text(
              'These Terms and Conditions were last updated in 2025. '
              'PasadaNow reserves the right to modify these terms at any time. '
              'Continued use of the application constitutes acceptance of the revised terms.',
              style: TextStyle(color: _orange, fontSize: 11.5, height: 1.5),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});
  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen>
    with SingleTickerProviderStateMixin {
  int _page = 0;
  String _role = '';

  late AnimationController _animController;
  late Animation<double> _fadeAnim;
  late Animation<Offset> _slideAnim;

  final _authService = AuthService();
  final _username    = TextEditingController();
  final _password    = TextEditingController();
  final _confirmPwd  = TextEditingController();
  final _fullName    = TextEditingController();
  final _phone       = TextEditingController();
  final _email       = TextEditingController();
  final _address     = TextEditingController();
  final _age         = TextEditingController();
  final _licenseNo   = TextEditingController();
  final _plateNo     = TextEditingController();
  final _todaNo      = TextEditingController();

  // ── Validation error strings (null = no error) ───────────────────────────
  final Map<String, String?> _errors = {};

  bool _obscurePwd     = true;
  bool _obscureConfirm = true;
  bool _agreedTerms    = false;
  bool _loading        = false;

  XFile?    _profilePhoto;
  XFile?    _licensePhoto;
  XFile?    _vehiclePhoto;
  XFile?    _todaClearancePhoto;

  Uint8List? _profileBytes;
  Uint8List? _licenseBytes;
  Uint8List? _vehicleBytes;
  Uint8List? _todaBytes;

  final ImagePicker _picker = ImagePicker();

  static const Color _bgDeep      = Color(0xFF0B1B35);
  static const Color _bgCard      = Color(0xFF102245);
  static const Color _inputBg     = Color(0xFF0D1E3D);
  static const Color _accent      = Color(0xFF3D7FD4);
  static const Color _accentLight = Color(0xFF5B9BF0);
  static const Color _orange      = Color(0xFFE8863A);
  static const Color _green       = Color(0xFF22C55E);
  static const Color _errorRed    = Color(0xFFEF4444);
  static const Color _textPrimary = Color(0xFFE8EEF7);
  static const Color _textMuted   = Color(0xFF8A9BC0);
  static const Color _border      = Color(0xFF1E3A6E);

  // ── Validation Rules ─────────────────────────────────────────────────────

  String? _validateUsername(String v) {
    if (v.isEmpty) return 'Username is required';
    if (v.length < 4) return 'At least 4 characters';
    if (v.length > 30) return 'Max 30 characters';
    if (!RegExp(r'^[a-zA-Z0-9._]+$').hasMatch(v))
      return 'Only letters, numbers, . and _';
    if (v.startsWith('.') || v.startsWith('_'))
      return 'Cannot start with . or _';
    return null;
  }

  String? _validateFullName(String v) {
    if (v.isEmpty) return 'Full name is required';
    if (v.trim().split(' ').length < 2) return 'Enter first and last name';
    if (!RegExp(r"^[a-zA-ZÀ-ÿ\s'\-\.]+$").hasMatch(v))
      return 'No special characters or numbers';
    if (v.length < 5) return 'Name too short';
    if (v.length > 80) return 'Name too long';
    return null;
  }

  String? _validateAge(String v) {
    if (v.isEmpty) return 'Age is required';
    final n = int.tryParse(v);
    if (n == null) return 'Enter a valid number';
    if (n < 18) return 'Must be at least 18 years old';
    if (n > 80) return 'Enter a realistic age';
    return null;
  }

  String? _validatePhone(String v) {
    if (v.isEmpty) return 'Phone number is required';
    final clean = v.replaceAll(RegExp(r'[\s\-]'), '');
    if (!RegExp(r'^(09|\+639)\d{9}$').hasMatch(clean))
      return 'Enter a valid PH number (09xx or +639xx)';
    return null;
  }

  String? _validateEmail(String v) {
    if (v.isEmpty) return 'Email is required';
    if (!RegExp(r'^[\w\.\+\-]+@[\w\-]+\.[a-zA-Z]{2,}$').hasMatch(v))
      return 'Enter a valid email address';
    return null;
  }

  String? _validateAddress(String v) {
    if (v.isEmpty) return 'Address is required';
    if (v.trim().length < 10) return 'Please enter a complete address';
    return null;
  }

  String? _validatePassword(String v) {
    if (v.isEmpty) return 'Password is required';
    if (v.length < 8) return 'At least 8 characters';
    if (!RegExp(r'[A-Z]').hasMatch(v)) return 'Add at least one uppercase letter';
    if (!RegExp(r'[0-9]').hasMatch(v)) return 'Add at least one number';
    if (!RegExp(r'[!@#\$%^&*(),.?":{}|<>]').hasMatch(v))
      return 'Add at least one special character';
    return null;
  }

  String? _validateConfirmPassword(String v) {
    if (v.isEmpty) return 'Please confirm your password';
    if (v != _password.text) return 'Passwords do not match';
    return null;
  }

  String? _validateLicenseNo(String v) {
    if (v.isEmpty) return "License number is required";
    if (v.trim().length < 6) return 'Enter a valid license number';
    return null;
  }

  String? _validatePlateNo(String v) {
    if (v.isEmpty) return 'Plate number is required';
    if (!RegExp(r'^[A-Za-z0-9\s\-]{4,10}$').hasMatch(v.trim()))
      return 'Enter a valid plate (e.g. ABC 1234)';
    return null;
  }

  String? _validateTodaNo(String v) {
    if (v.isEmpty) return 'TODA / Branch info is required';
    if (v.trim().length < 3) return 'Please enter a valid TODA name';
    return null;
  }

  // ── Field-level validate & set error ─────────────────────────────────────
  void _validateField(String key, String value, String? Function(String) validator) {
    setState(() => _errors[key] = validator(value));
  }

  // ── Full form validate before submit ─────────────────────────────────────
  bool _validateCommuterForm() {
    final newErrors = <String, String?>{
      'username':        _validateUsername(_username.text),
      'fullName':        _validateFullName(_fullName.text),
      'age':             _validateAge(_age.text),
      'phone':           _validatePhone(_phone.text),
      'email':           _validateEmail(_email.text),
      'address':         _validateAddress(_address.text),
      'password':        _validatePassword(_password.text),
      'confirmPassword': _validateConfirmPassword(_confirmPwd.text),
    };
    setState(() => _errors.addAll(newErrors));
    return newErrors.values.every((e) => e == null);
  }

  bool _validateDriverForm() {
    final newErrors = <String, String?>{
      'username':        _validateUsername(_username.text),
      'fullName':        _validateFullName(_fullName.text),
      'age':             _validateAge(_age.text),
      'phone':           _validatePhone(_phone.text),
      'email':           _validateEmail(_email.text),
      'address':         _validateAddress(_address.text),
      'licenseNo':       _validateLicenseNo(_licenseNo.text),
      'plateNo':         _validatePlateNo(_plateNo.text),
      'todaNo':          _validateTodaNo(_todaNo.text),
      'password':        _validatePassword(_password.text),
      'confirmPassword': _validateConfirmPassword(_confirmPwd.text),
    };
    setState(() => _errors.addAll(newErrors));
    return newErrors.values.every((e) => e == null);
  }

  // ── Password strength (0-4) ───────────────────────────────────────────────
  int _passwordStrength(String v) {
    int score = 0;
    if (v.length >= 8) score++;
    if (RegExp(r'[A-Z]').hasMatch(v)) score++;
    if (RegExp(r'[0-9]').hasMatch(v)) score++;
    if (RegExp(r'[!@#\$%^&*(),.?":{}|<>]').hasMatch(v)) score++;
    return score;
  }

  Color _strengthColor(int s) {
    if (s <= 1) return _errorRed;
    if (s == 2) return _orange;
    if (s == 3) return const Color(0xFFEAB308);
    return _green;
  }

  String _strengthLabel(int s) {
    if (s <= 1) return 'Weak';
    if (s == 2) return 'Fair';
    if (s == 3) return 'Good';
    return 'Strong';
  }

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 450));
    _fadeAnim  = CurvedAnimation(parent: _animController, curve: Curves.easeOut);
    _slideAnim = Tween<Offset>(begin: const Offset(0, 0.06), end: Offset.zero)
        .animate(CurvedAnimation(parent: _animController, curve: Curves.easeOut));
    _animController.forward();
  }

  @override
  void dispose() {
    _animController.dispose();
    for (final c in [
      _username, _password, _confirmPwd, _fullName, _phone,
      _email, _address, _age, _licenseNo, _plateNo, _todaNo,
    ]) { c.dispose(); }
    super.dispose();
  }

  void _goToForm(String role) {
    setState(() { _role = role; _page = role == 'commuter' ? 1 : 2; _errors.clear(); });
    _animController..reset()..forward();
  }

  void _backToRoles() {
    setState(() { _page = 0; _errors.clear(); });
    _animController..reset()..forward();
  }

  Future<void> _pickImage({required _ImageSlot slot}) async {
    final source = await _showImageSourceDialog();
    if (source == null) return;
    final XFile? picked = await _picker.pickImage(
      source: source, imageQuality: 85, maxWidth: 1200,
    );
    if (picked == null) return;
    final bytes = await picked.readAsBytes();
    // Max 3MB
    if (bytes.lengthInBytes > 3 * 1024 * 1024) {
      _showSnack('Image too large. Max 3 MB allowed.', _errorRed);
      return;
    }
    setState(() {
      switch (slot) {
        case _ImageSlot.profile:
          _profilePhoto = picked; _profileBytes = bytes; break;
        case _ImageSlot.license:
          _licensePhoto = picked; _licenseBytes = bytes;
          _errors.remove('licensePhoto'); break;
        case _ImageSlot.vehicle:
          _vehiclePhoto = picked; _vehicleBytes = bytes;
          _errors.remove('vehiclePhoto'); break;
        case _ImageSlot.todaClearance:
          _todaClearancePhoto = picked; _todaBytes = bytes;
          _errors.remove('todaPhoto'); break;
      }
    });
  }

  Future<ImageSource?> _showImageSourceDialog() async {
    if (kIsWeb) return ImageSource.gallery;
    return showModalBottomSheet<ImageSource>(
      context: context,
      backgroundColor: _bgCard,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 8),
            Container(width: 36, height: 4,
                decoration: BoxDecoration(color: _border, borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 16),
            Row(mainAxisAlignment: MainAxisAlignment.center, children: const [
              Icon(Icons.add_a_photo_outlined, color: _textPrimary, size: 18),
              SizedBox(width: 8),
              Text('Choose Image Source',
                  style: TextStyle(color: _textPrimary, fontSize: 15, fontWeight: FontWeight.w700)),
            ]),
            const SizedBox(height: 16),
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                    color: _accent.withOpacity(0.15), borderRadius: BorderRadius.circular(10)),
                child: const Icon(Icons.camera_alt_outlined, color: _accentLight, size: 22),
              ),
              title: const Text('Take Photo', style: TextStyle(color: _textPrimary, fontSize: 14)),
              onTap: () => Navigator.pop(ctx, ImageSource.camera),
            ),
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                    color: _orange.withOpacity(0.15), borderRadius: BorderRadius.circular(10)),
                child: const Icon(Icons.photo_library_outlined, color: _orange, size: 22),
              ),
              title: const Text('Choose from Gallery', style: TextStyle(color: _textPrimary, fontSize: 14)),
              onTap: () => Navigator.pop(ctx, ImageSource.gallery),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Future<void> _register() async {
    final valid = _role == 'commuter'
        ? _validateCommuterForm()
        : _validateDriverForm();

    if (!valid) {
      _showSnack('Please fix the errors highlighted below.', _errorRed);
      return;
    }
    if (!_agreedTerms) {
      _showSnack('Please agree to the Terms & Conditions.', _errorRed);
      return;
    }
    if (_role == 'driver') {
      bool docError = false;
      if (_licenseBytes == null) {
        setState(() => _errors['licensePhoto'] = "Driver's License photo is required");
        docError = true;
      }
      if (_vehicleBytes == null) {
        setState(() => _errors['vehiclePhoto'] = 'Vehicle / Plate photo is required');
        docError = true;
      }
      if (_todaBytes == null) {
        setState(() => _errors['todaPhoto'] = 'TODA Clearance photo is required');
        docError = true;
      }
      if (docError) {
        _showSnack('Please upload all required document photos.', _errorRed);
        return;
      }
    }

    setState(() => _loading = true);
    try {
      final data = <String, dynamic>{
        'username':  _username.text.trim(),
        'password':  _password.text,
        'fullName':  _fullName.text.trim(),
        'age':       _age.text.trim(),
        'phone':     _phone.text.trim(),
        'email':     _email.text.trim(),
        'address':   _address.text.trim(),
        'role':      _role,
        if (_profileBytes != null) 'profilePhoto': base64Encode(_profileBytes!),
        if (_role == 'driver') ...{
          'licenseNo': _licenseNo.text.trim(),
          'plateNo':   _plateNo.text.trim(),
          'todaNo':    _todaNo.text.trim(),
          if (_licenseBytes != null) 'photoLicense': base64Encode(_licenseBytes!),
          if (_vehicleBytes != null) 'photoPlate':   base64Encode(_vehicleBytes!),
          if (_todaBytes    != null) 'photoToda':    base64Encode(_todaBytes!),
        },
      };
      await _authService.register(data);
      if (!mounted) return;
      _showSnack(
        _role == 'commuter'
            ? 'Account created! You can now sign in.'
            : 'Registered! Awaiting admin verification.',
        _green,
      );
      Navigator.pushReplacement(
          context, MaterialPageRoute(builder: (_) => const LoginScreen()));
    } on AuthException catch (e) {
      _showSnack(e.message, _errorRed);
    } catch (_) {
      _showSnack('Registration failed. Please try again.', _errorRed);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showSnack(String msg, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: color,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    ));
  }

  // ─────────────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bgDeep,
      body: SafeArea(
        child: FadeTransition(
          opacity: _fadeAnim,
          child: SlideTransition(
            position: _slideAnim,
            child: _page == 0
                ? _buildRoleSelection()
                : _page == 1
                    ? _buildCommuterForm()
                    : _buildDriverForm(),
          ),
        ),
      ),
    );
  }

  // ── ROLE SELECTION ────────────────────────────────────────────────────────
  Widget _buildRoleSelection() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          const SizedBox(height: 20),
          _buildBrand(),
          const SizedBox(height: 40),
          const Text('Create Account',
              style: TextStyle(color: _textPrimary, fontSize: 28, fontWeight: FontWeight.w900)),
          const SizedBox(height: 8),
          const Text('Who are you registering as?',
              style: TextStyle(color: _textMuted, fontSize: 14)),
          const SizedBox(height: 32),
          Row(
            children: [
              Expanded(child: _roleCard(
                icon: Icons.person_outline_rounded,
                iconBg: _accent.withOpacity(0.15),
                iconColor: _accentLight,
                label: 'Commuter',
                desc: 'Book tricycle rides around the city',
                role: 'commuter',
              )),
              const SizedBox(width: 16),
              Expanded(child: _roleCardTricycle(
                iconBg: _orange.withOpacity(0.15),
                label: 'Driver',
                desc: 'Register your tricycle & earn',
                role: 'driver',
                highlighted: true,
              )),
            ],
          ),
          const SizedBox(height: 40),
          _buildSignInFooter(),
        ],
      ),
    );
  }

  // ── COMMUTER FORM ─────────────────────────────────────────────────────────
  Widget _buildCommuterForm() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _buildBackLink(),
          const SizedBox(height: 16),
          _buildBrand(),
          const SizedBox(height: 12),
          Center(child: _roleBadge('COMMUTER', _accent, Icons.person_outline_rounded)),
          const SizedBox(height: 16),
          const Text('Create Account',
              textAlign: TextAlign.center,
              style: TextStyle(color: _textPrimary, fontSize: 24, fontWeight: FontWeight.w900)),
          const SizedBox(height: 4),
          const Text('Join PasadaNow and ride today!',
              textAlign: TextAlign.center,
              style: TextStyle(color: _textMuted, fontSize: 13)),
          const SizedBox(height: 24),
          _buildProfilePhotoUpload(),
          const SizedBox(height: 20),
          _sectionDivider('ACCOUNT INFO', Icons.lock_outline_rounded),
          const SizedBox(height: 14),
          _field(
            controller: _username, label: 'Username', hint: 'Choose a username',
            icon: Icons.person_outline_rounded, required: true,
            errorKey: 'username',
            onChanged: (v) => _validateField('username', v, _validateUsername),
          ),
          const SizedBox(height: 14),
          _sectionDivider('PERSONAL INFO', Icons.badge_outlined),
          const SizedBox(height: 14),
          Row(children: [
            Expanded(child: _field(
              controller: _fullName, label: 'Full Name', hint: 'Full name',
              icon: Icons.badge_outlined, required: true, errorKey: 'fullName',
              onChanged: (v) => _validateField('fullName', v, _validateFullName),
            )),
            const SizedBox(width: 12),
            Expanded(child: _field(
              controller: _age, label: 'Age', hint: 'e.g. 25',
              icon: Icons.cake_outlined, keyboardType: TextInputType.number,
              errorKey: 'age', required: true,
              onChanged: (v) => _validateField('age', v, _validateAge),
            )),
          ]),
          const SizedBox(height: 14),
          _field(
            controller: _phone, label: 'Phone Number', hint: '09xx-xxx-xxxx',
            icon: Icons.phone_outlined, keyboardType: TextInputType.phone,
            required: true, errorKey: 'phone',
            onChanged: (v) => _validateField('phone', v, _validatePhone),
          ),
          const SizedBox(height: 14),
          _field(
            controller: _email, label: 'Email Address', hint: 'Enter your email',
            icon: Icons.email_outlined, keyboardType: TextInputType.emailAddress,
            required: true, errorKey: 'email',
            onChanged: (v) => _validateField('email', v, _validateEmail),
          ),
          const SizedBox(height: 14),
          _field(
            controller: _address, label: 'Address', hint: 'Barangay, City, Province',
            icon: Icons.location_on_outlined, required: true, errorKey: 'address',
            onChanged: (v) => _validateField('address', v, _validateAddress),
          ),
          const SizedBox(height: 20),
          _sectionDivider('ACCOUNT SECURITY', Icons.security_outlined),
          const SizedBox(height: 14),
          _passwordField(
            controller: _password, label: 'Password', hint: 'Password',
            obscure: _obscurePwd, errorKey: 'password', required: true,
            onToggle: () => setState(() => _obscurePwd = !_obscurePwd),
            onChanged: (v) {
              _validateField('password', v, _validatePassword);
              if (_confirmPwd.text.isNotEmpty)
                _validateField('confirmPassword', _confirmPwd.text, _validateConfirmPassword);
              setState(() {});
            },
          ),
          if (_password.text.isNotEmpty) ...[
            const SizedBox(height: 8),
            _buildPasswordStrengthBar(_password.text),
          ],
          const SizedBox(height: 14),
          _passwordField(
            controller: _confirmPwd, label: 'Confirm Password', hint: 'Re-enter password',
            obscure: _obscureConfirm, errorKey: 'confirmPassword', required: true,
            onToggle: () => setState(() => _obscureConfirm = !_obscureConfirm),
            onChanged: (v) => _validateField('confirmPassword', v, _validateConfirmPassword),
          ),
          const SizedBox(height: 16),
          _termsCheckbox(),
          const SizedBox(height: 20),
          _buildSubmitButton('Create Commuter Account', _accent, Icons.rocket_launch_outlined),
          const SizedBox(height: 16),
          _buildSignInFooter(),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  // ── DRIVER FORM ───────────────────────────────────────────────────────────
  Widget _buildDriverForm() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _buildBackLink(),
          const SizedBox(height: 16),
          _buildBrand(),
          const SizedBox(height: 12),
          Center(child: _roleBadgeTricycle('DRIVER', _orange)),
          const SizedBox(height: 16),
          const Text('Create Driver Account',
              textAlign: TextAlign.center,
              style: TextStyle(color: _textPrimary, fontSize: 24, fontWeight: FontWeight.w900)),
          const SizedBox(height: 4),
          const Text('Register to start accepting rides on PasadaNow!',
              textAlign: TextAlign.center,
              style: TextStyle(color: _textMuted, fontSize: 13)),
          const SizedBox(height: 24),
          _sectionDivider('ACCOUNT INFO', Icons.lock_outline_rounded),
          const SizedBox(height: 14),
          _field(
            controller: _username, label: 'Username', hint: 'Choose a username',
            icon: Icons.person_outline_rounded, required: true, errorKey: 'username',
            onChanged: (v) => _validateField('username', v, _validateUsername),
          ),
          const SizedBox(height: 20),
          _sectionDivider('PERSONAL INFO', Icons.badge_outlined),
          const SizedBox(height: 14),
          _buildProfilePhotoUpload(),
          const SizedBox(height: 14),
          Row(children: [
            Expanded(child: _field(
              controller: _fullName, label: 'Full Name', hint: 'Juan dela Cruz',
              icon: Icons.badge_outlined, required: true, errorKey: 'fullName',
              onChanged: (v) => _validateField('fullName', v, _validateFullName),
            )),
            const SizedBox(width: 12),
            Expanded(child: _field(
              controller: _age, label: 'Age', hint: 'e.g. 25',
              icon: Icons.cake_outlined, keyboardType: TextInputType.number,
              required: true, errorKey: 'age',
              onChanged: (v) => _validateField('age', v, _validateAge),
            )),
          ]),
          const SizedBox(height: 14),
          _field(
            controller: _phone, label: 'Contact Number', hint: '09xx-xxx-xxxx',
            icon: Icons.phone_outlined, keyboardType: TextInputType.phone,
            required: true, errorKey: 'phone',
            onChanged: (v) => _validateField('phone', v, _validatePhone),
          ),
          const SizedBox(height: 14),
          _field(
            controller: _email, label: 'Email Address', hint: 'Enter your email',
            icon: Icons.email_outlined, keyboardType: TextInputType.emailAddress,
            required: true, errorKey: 'email',
            onChanged: (v) => _validateField('email', v, _validateEmail),
          ),
          const SizedBox(height: 14),
          _field(
            controller: _address, label: 'Address', hint: 'Barangay, City, Province',
            icon: Icons.location_on_outlined, required: true, errorKey: 'address',
            onChanged: (v) => _validateField('address', v, _validateAddress),
          ),
          const SizedBox(height: 20),
          _sectionDivider('VEHICLE & LICENSE', Icons.directions_car_outlined),
          const SizedBox(height: 14),
          Row(children: [
            Expanded(child: _field(
              controller: _plateNo, label: 'Plate Number', hint: 'e.g. ABC 1234',
              icon: Icons.pin_outlined, required: true, errorKey: 'plateNo',
              onChanged: (v) => _validateField('plateNo', v, _validatePlateNo),
            )),
            const SizedBox(width: 12),
            Expanded(child: _field(
              controller: _licenseNo, label: "Driver's License No.", hint: 'e.g. N01-23-456789',
              icon: Icons.credit_card_outlined, required: true, errorKey: 'licenseNo',
              onChanged: (v) => _validateField('licenseNo', v, _validateLicenseNo),
            )),
          ]),
          const SizedBox(height: 14),
          _field(
            controller: _todaNo, label: 'Branch / TODA / Party',
            hint: 'e.g. Center TODA, Session Road Terminal',
            icon: Icons.store_outlined, required: true, errorKey: 'todaNo',
            onChanged: (v) => _validateField('todaNo', v, _validateTodaNo),
          ),
          const SizedBox(height: 20),
          _sectionDivider('CREDENTIAL DOCUMENTS', Icons.folder_outlined),
          const SizedBox(height: 6),
          _buildCredentialNote(),
          const SizedBox(height: 14),
          _buildCredentialUpload(
            slot: _ImageSlot.license, bytes: _licenseBytes,
            icon: Icons.credit_card_outlined, label: "Driver's License Photo",
            sublabel: 'Front side clearly visible', required: true,
            errorKey: 'licensePhoto',
          ),
          const SizedBox(height: 12),
          _buildCredentialUpload(
            slot: _ImageSlot.vehicle, bytes: _vehicleBytes,
            icon: Icons.directions_car_outlined, label: 'Vehicle / Plate Photo',
            sublabel: 'Plate number must be readable', required: true,
            errorKey: 'vehiclePhoto',
          ),
          const SizedBox(height: 12),
          _buildCredentialUpload(
            slot: _ImageSlot.todaClearance, bytes: _todaBytes,
            icon: Icons.description_outlined, label: 'TODA Clearance',
            sublabel: 'Official TODA or franchise document', required: true,
            errorKey: 'todaPhoto',
          ),
          const SizedBox(height: 20),
          _sectionDivider('ACCOUNT SECURITY', Icons.security_outlined),
          const SizedBox(height: 14),
          _passwordField(
            controller: _password, label: 'Password', hint: 'Password',
            obscure: _obscurePwd, errorKey: 'password', required: true,
            onToggle: () => setState(() => _obscurePwd = !_obscurePwd),
            onChanged: (v) {
              _validateField('password', v, _validatePassword);
              if (_confirmPwd.text.isNotEmpty)
                _validateField('confirmPassword', _confirmPwd.text, _validateConfirmPassword);
              setState(() {});
            },
          ),
          if (_password.text.isNotEmpty) ...[
            const SizedBox(height: 8),
            _buildPasswordStrengthBar(_password.text),
          ],
          const SizedBox(height: 14),
          _passwordField(
            controller: _confirmPwd, label: 'Confirm Password', hint: 'Re-enter password',
            obscure: _obscureConfirm, errorKey: 'confirmPassword', required: true,
            onToggle: () => setState(() => _obscureConfirm = !_obscureConfirm),
            onChanged: (v) => _validateField('confirmPassword', v, _validateConfirmPassword),
          ),
          const SizedBox(height: 16),
          _termsCheckbox(),
          const SizedBox(height: 20),
          _buildSubmitButtonTricycle('Create Driver Account', _orange),
          const SizedBox(height: 16),
          _buildSignInFooter(),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  // ── PASSWORD STRENGTH BAR ─────────────────────────────────────────────────
  Widget _buildPasswordStrengthBar(String pwd) {
    final strength = _passwordStrength(pwd);
    final color    = _strengthColor(strength);
    final label    = _strengthLabel(strength);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: List.generate(4, (i) {
            return Expanded(
              child: Container(
                margin: EdgeInsets.only(right: i < 3 ? 4 : 0),
                height: 4,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(2),
                  color: i < strength ? color : _border,
                ),
              ),
            );
          }),
        ),
        const SizedBox(height: 4),
        Row(
          children: [
            Icon(
              strength <= 1 ? Icons.warning_amber_rounded
                  : strength == 4 ? Icons.check_circle_outline_rounded
                  : Icons.info_outline_rounded,
              size: 11, color: color,
            ),
            const SizedBox(width: 4),
            Text(
              'Password strength: $label',
              style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600),
            ),
            if (strength < 4) ...[
              const SizedBox(width: 6),
              Text(
                _strengthHint(strength, pwd),
                style: const TextStyle(color: _textMuted, fontSize: 10),
              ),
            ],
          ],
        ),
      ],
    );
  }

  String _strengthHint(int strength, String pwd) {
    if (!RegExp(r'[A-Z]').hasMatch(pwd)) return '· Add uppercase';
    if (!RegExp(r'[0-9]').hasMatch(pwd)) return '· Add a number';
    if (!RegExp(r'[!@#\$%^&*(),.?":{}|<>]').hasMatch(pwd)) return '· Add a symbol';
    if (pwd.length < 8) return '· Needs 8+ chars';
    return '';
  }

  // ── WIDGETS ───────────────────────────────────────────────────────────────

  Widget _buildBrand() {
    return Column(
      children: [
        Container(
          width: 56, height: 56,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(color: const Color(0xFF5B9BF0).withOpacity(0.55), blurRadius: 20, spreadRadius: 3),
              BoxShadow(color: const Color(0xFF3D7FD4).withOpacity(0.35), blurRadius: 40, spreadRadius: 6),
            ],
          ),
          child: Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: const Color(0xFF5B9BF0).withOpacity(0.5), width: 2),
              gradient: const LinearGradient(
                colors: [Color(0xFF2A5FC0), Color(0xFF0D1E3D)],
                begin: Alignment.topLeft, end: Alignment.bottomRight,
              ),
            ),
            child: ClipOval(
              child: Image.asset('assets/logo.png', fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(
                    color: const Color(0xFF1A3A80),
                    child: Center(child: TricycleIcon(size: 28, color: Colors.white)),
                  )),
            ),
          ),
        ),
        const SizedBox(height: 10),
        RichText(
          text: const TextSpan(
            style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900),
            children: [
              TextSpan(text: 'Pasada', style: TextStyle(color: _textPrimary)),
              TextSpan(text: 'Now', style: TextStyle(color: _orange)),
            ],
          ),
        ),
        const SizedBox(height: 4),
        const Text('TRICYCLE RIDE HAILING SYSTEM',
            style: TextStyle(fontSize: 9, letterSpacing: 2.5, color: _textMuted, fontWeight: FontWeight.w600)),
      ],
    );
  }

  Widget _roleCard({
    required IconData icon, required Color iconBg, required Color iconColor,
    required String label, required String desc, required String role, bool highlighted = false,
  }) {
    return GestureDetector(
      onTap: () => _goToForm(role),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
        decoration: BoxDecoration(
          color: highlighted ? const Color(0xFF162B50) : _bgCard,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: highlighted ? _orange.withOpacity(0.5) : _border, width: highlighted ? 1.5 : 1),
          boxShadow: highlighted ? [BoxShadow(color: _orange.withOpacity(0.15), blurRadius: 16, offset: const Offset(0, 4))] : null,
        ),
        child: Column(children: [
          Container(width: 56, height: 56,
              decoration: BoxDecoration(color: iconBg, borderRadius: BorderRadius.circular(14)),
              child: Icon(icon, color: iconColor, size: 28)),
          const SizedBox(height: 14),
          Text(label, style: const TextStyle(color: _textPrimary, fontSize: 14, fontWeight: FontWeight.w800)),
          const SizedBox(height: 6),
          Text(desc, textAlign: TextAlign.center,
              style: const TextStyle(color: _textMuted, fontSize: 12, height: 1.4)),
        ]),
      ),
    );
  }

  Widget _roleCardTricycle({
    required Color iconBg, required String label, required String desc,
    required String role, bool highlighted = false,
  }) {
    return GestureDetector(
      onTap: () => _goToForm(role),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
        decoration: BoxDecoration(
          color: highlighted ? const Color(0xFF162B50) : _bgCard,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: highlighted ? _orange.withOpacity(0.5) : _border, width: highlighted ? 1.5 : 1),
          boxShadow: highlighted ? [BoxShadow(color: _orange.withOpacity(0.15), blurRadius: 16, offset: const Offset(0, 4))] : null,
        ),
        child: Column(children: [
          Container(width: 56, height: 56,
              decoration: BoxDecoration(color: iconBg, borderRadius: BorderRadius.circular(14)),
              child: Center(child: TricycleIcon(size: 30, color: _orange))),
          const SizedBox(height: 14),
          Text(label, style: const TextStyle(color: _textPrimary, fontSize: 14, fontWeight: FontWeight.w800)),
          const SizedBox(height: 6),
          Text(desc, textAlign: TextAlign.center,
              style: const TextStyle(color: _textMuted, fontSize: 12, height: 1.4)),
        ]),
      ),
    );
  }

  Widget _roleBadge(String label, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.35), width: 1),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, color: color, size: 14), const SizedBox(width: 6),
        Text(label, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w700, letterSpacing: 1)),
      ]),
    );
  }

  Widget _roleBadgeTricycle(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.35), width: 1),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        TricycleIcon(size: 14, color: color), const SizedBox(width: 6),
        Text(label, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w700, letterSpacing: 1)),
      ]),
    );
  }

  Widget _buildBackLink() {
    return GestureDetector(
      onTap: _backToRoles,
      child: Row(mainAxisSize: MainAxisSize.min, children: const [
        Icon(Icons.arrow_back_ios_rounded, size: 14, color: _textMuted),
        SizedBox(width: 6),
        Text('Back to role selection', style: TextStyle(color: _textMuted, fontSize: 13)),
      ]),
    );
  }

  Widget _sectionDivider(String label, IconData icon) {
    return Row(children: [
      Expanded(child: Divider(color: _border, thickness: 1)),
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, size: 12, color: _textMuted), const SizedBox(width: 5),
          Text(label, style: const TextStyle(color: _textMuted, fontSize: 10, letterSpacing: 1.5, fontWeight: FontWeight.w600)),
        ]),
      ),
      Expanded(child: Divider(color: _border, thickness: 1)),
    ]);
  }

  Widget _buildCredentialNote() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: _orange.withOpacity(0.08), borderRadius: BorderRadius.circular(10),
        border: Border.all(color: _orange.withOpacity(0.25), width: 1),
      ),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: const [
        Icon(Icons.warning_amber_rounded, color: _orange, size: 16),
        SizedBox(width: 8),
        Expanded(child: Text(
          'All credential photos are required for admin verification. '
          'Ensure images are clear and legible before uploading.',
          style: TextStyle(color: _orange, fontSize: 11.5, height: 1.5),
        )),
      ]),
    );
  }

  Widget _buildCredentialUpload({
    required _ImageSlot slot, required Uint8List? bytes,
    required IconData icon, required String label, required String sublabel,
    bool required = false, String? errorKey,
  }) {
    final bool hasFile   = bytes != null;
    final String? errMsg = errorKey != null ? _errors[errorKey] : null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GestureDetector(
          onTap: () => _pickImage(slot: slot),
          child: Container(
            decoration: BoxDecoration(
              color: _inputBg,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: errMsg != null
                    ? _errorRed.withOpacity(0.7)
                    : hasFile
                        ? _green.withOpacity(0.5)
                        : _border,
                width: errMsg != null || hasFile ? 1.5 : 1,
              ),
            ),
            child: Row(children: [
              ClipRRect(
                borderRadius: const BorderRadius.horizontal(left: Radius.circular(11)),
                child: hasFile
                    ? Image.memory(bytes, width: 80, height: 80, fit: BoxFit.cover)
                    : Container(
                        width: 80, height: 80,
                        color: errMsg != null ? _errorRed.withOpacity(0.08) : _orange.withOpacity(0.08),
                        child: Icon(icon, color: errMsg != null ? _errorRed : _orange, size: 30),
                      ),
              ),
              const SizedBox(width: 14),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Expanded(child: Text(label,
                      style: const TextStyle(color: _textPrimary, fontSize: 13, fontWeight: FontWeight.w600))),
                  if (required)
                    Container(
                      margin: const EdgeInsets.only(right: 10),
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                          color: _errorRed.withOpacity(0.15), borderRadius: BorderRadius.circular(4)),
                      child: const Text('Required',
                          style: TextStyle(color: _errorRed, fontSize: 9, fontWeight: FontWeight.w700, letterSpacing: 0.5)),
                    ),
                ]),
                const SizedBox(height: 3),
                Text(sublabel, style: const TextStyle(color: _textMuted, fontSize: 11)),
                const SizedBox(height: 6),
                Row(children: [
                  Icon(
                    hasFile ? Icons.check_circle_outline_rounded : Icons.upload_outlined,
                    size: 13, color: hasFile ? _green : _accentLight,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    hasFile ? 'Uploaded — tap to change' : 'Tap to upload photo',
                    style: TextStyle(
                        color: hasFile ? _green : _accentLight,
                        fontSize: 11, fontWeight: FontWeight.w600),
                  ),
                ]),
              ])),
            ]),
          ),
        ),
        if (errMsg != null) _errorText(errMsg),
      ],
    );
  }

  // ── TEXT FIELD ────────────────────────────────────────────────────────────
  Widget _field({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    TextInputType keyboardType = TextInputType.text,
    bool required = false,
    String? errorKey,
    ValueChanged<String>? onChanged,
  }) {
    final String? errMsg = errorKey != null ? _errors[errorKey] : null;
    final bool hasError  = errMsg != null;

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Icon(icon, size: 13, color: _textPrimary),
        const SizedBox(width: 5),
        Text(label, style: const TextStyle(color: _textPrimary, fontSize: 12, fontWeight: FontWeight.w600)),
        if (required) ...[
          const SizedBox(width: 3),
          const Text('*', style: TextStyle(color: _errorRed, fontSize: 12, fontWeight: FontWeight.w700)),
        ],
      ]),
      const SizedBox(height: 6),
      Container(
        decoration: BoxDecoration(
          color: _inputBg,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: hasError ? _errorRed.withOpacity(0.7) : _border, width: hasError ? 1.5 : 1),
        ),
        child: TextField(
          controller: controller,
          keyboardType: keyboardType,
          onChanged: onChanged,
          style: const TextStyle(color: _textPrimary, fontSize: 13),
          cursorColor: _accentLight,
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(color: _textMuted, fontSize: 13),
            prefixIcon: Icon(icon, size: 18, color: hasError ? _errorRed : _textMuted),
            suffixIcon: hasError
                ? const Icon(Icons.error_outline_rounded, size: 18, color: _errorRed)
                : null,
            border: InputBorder.none,
            contentPadding: const EdgeInsets.symmetric(horizontal: 4, vertical: 13),
            isDense: true,
          ),
        ),
      ),
      if (hasError) _errorText(errMsg),
    ]);
  }

  // ── PASSWORD FIELD ────────────────────────────────────────────────────────
  Widget _passwordField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required bool obscure,
    required VoidCallback onToggle,
    bool required = false,
    String? errorKey,
    ValueChanged<String>? onChanged,
  }) {
    final String? errMsg = errorKey != null ? _errors[errorKey] : null;
    final bool hasError  = errMsg != null;

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        const Icon(Icons.lock_outline_rounded, size: 13, color: _textPrimary),
        const SizedBox(width: 5),
        Text(label, style: const TextStyle(color: _textPrimary, fontSize: 12, fontWeight: FontWeight.w600)),
        if (required) ...[
          const SizedBox(width: 3),
          const Text('*', style: TextStyle(color: _errorRed, fontSize: 12, fontWeight: FontWeight.w700)),
        ],
      ]),
      const SizedBox(height: 6),
      Container(
        decoration: BoxDecoration(
          color: _inputBg,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: hasError ? _errorRed.withOpacity(0.7) : _border, width: hasError ? 1.5 : 1),
        ),
        child: TextField(
          controller: controller,
          obscureText: obscure,
          onChanged: onChanged,
          style: const TextStyle(color: _textPrimary, fontSize: 13),
          cursorColor: _accentLight,
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(color: _textMuted, fontSize: 13),
            prefixIcon: const Icon(Icons.lock_outline_rounded, size: 18, color: _textMuted),
            suffixIcon: GestureDetector(
              onTap: onToggle,
              child: Icon(obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                  size: 18, color: hasError ? _errorRed : _textMuted),
            ),
            border: InputBorder.none,
            contentPadding: const EdgeInsets.symmetric(horizontal: 4, vertical: 13),
            isDense: true,
          ),
        ),
      ),
      if (hasError) _errorText(errMsg),
    ]);
  }

  // ── INLINE ERROR TEXT ─────────────────────────────────────────────────────
  Widget _errorText(String msg) {
    return Padding(
      padding: const EdgeInsets.only(top: 5, left: 4),
      child: Row(children: [
        const Icon(Icons.info_outline_rounded, size: 12, color: _errorRed),
        const SizedBox(width: 4),
        Flexible(child: Text(msg,
            style: const TextStyle(color: _errorRed, fontSize: 11, fontWeight: FontWeight.w500))),
      ]),
    );
  }

  Widget _buildProfilePhotoUpload() {
    final bool hasPhoto = _profileBytes != null;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: const [
        Icon(Icons.account_circle_outlined, size: 13, color: _textPrimary),
        SizedBox(width: 5),
        Text('Profile Photo', style: TextStyle(color: _textPrimary, fontSize: 12, fontWeight: FontWeight.w600)),
        SizedBox(width: 6),
        Text('(optional)', style: TextStyle(color: _textMuted, fontSize: 11)),
      ]),
      const SizedBox(height: 8),
      GestureDetector(
        onTap: () => _pickImage(slot: _ImageSlot.profile),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: _inputBg, borderRadius: BorderRadius.circular(10),
            border: Border.all(color: hasPhoto ? _green.withOpacity(0.5) : _border, width: 1),
          ),
          child: Row(children: [
            Container(
              width: 48, height: 48,
              decoration: BoxDecoration(color: _accent.withOpacity(0.15), shape: BoxShape.circle),
              child: hasPhoto
                  ? ClipOval(child: Image.memory(_profileBytes!, width: 48, height: 48, fit: BoxFit.cover))
                  : const Icon(Icons.person_outline_rounded, color: _accentLight, size: 26),
            ),
            const SizedBox(width: 14),
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(
                hasPhoto ? 'Photo uploaded — tap to change' : 'Upload Profile Photo',
                style: TextStyle(color: hasPhoto ? _green : _textPrimary, fontSize: 13, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 3),
              const Text('JPG, PNG or WEBP · Max 3 MB',
                  style: TextStyle(color: _textMuted, fontSize: 11)),
            ]),
            const Spacer(),
            Icon(hasPhoto ? Icons.check_circle_outline_rounded : Icons.upload_outlined,
                color: hasPhoto ? _green : _textMuted, size: 20),
          ]),
        ),
      ),
    ]);
  }

  // ── TERMS CHECKBOX — with clickable link ──────────────────────────────────
  Widget _termsCheckbox() {
    return GestureDetector(
      onTap: () => setState(() => _agreedTerms = !_agreedTerms),
      child: Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
        SizedBox(
          width: 20, height: 20,
          child: Checkbox(
            value: _agreedTerms,
            onChanged: (v) => setState(() => _agreedTerms = v!),
            activeColor: _accent,
            checkColor: Colors.white,
            side: const BorderSide(color: _textMuted, width: 1.5),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
          ),
        ),
        const SizedBox(width: 10),
        const Icon(Icons.description_outlined, size: 14, color: _textMuted),
        const SizedBox(width: 5),
        Expanded(
          child: RichText(
            text: TextSpan(
              style: const TextStyle(fontSize: 13, color: _textPrimary),
              children: [
                const TextSpan(text: 'I agree to the '),
                WidgetSpan(
                  alignment: PlaceholderAlignment.middle,
                  child: GestureDetector(
                    // ← This now opens the Terms & Conditions modal
                    onTap: () => TermsAndConditionsModal.show(context),
                    child: const Text(
                      'Terms & Conditions',
                      style: TextStyle(
                        color: _accentLight,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        decoration: TextDecoration.underline,
                        decorationColor: _accentLight,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ]),
    );
  }

  Widget _buildSubmitButton(String label, Color color, IconData icon) {
    return Container(
      height: 50,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12), color: color,
        boxShadow: [BoxShadow(color: color.withOpacity(0.4), blurRadius: 14, offset: const Offset(0, 4))],
      ),
      child: ElevatedButton(
        onPressed: _loading ? null : _register,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent, shadowColor: Colors.transparent,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        child: _loading
            ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5))
            : Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                Icon(icon, size: 18, color: Colors.white), const SizedBox(width: 8),
                Text(label, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
              ]),
      ),
    );
  }

  Widget _buildSubmitButtonTricycle(String label, Color color) {
    return Container(
      height: 50,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12), color: color,
        boxShadow: [BoxShadow(color: color.withOpacity(0.4), blurRadius: 14, offset: const Offset(0, 4))],
      ),
      child: ElevatedButton(
        onPressed: _loading ? null : _register,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent, shadowColor: Colors.transparent,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        child: _loading
            ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5))
            : Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                TricycleIcon(size: 18, color: Colors.white), const SizedBox(width: 8),
                Text(label, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
              ]),
      ),
    );
  }

  Widget _buildSignInFooter() {
    return Center(
      child: RichText(
        text: TextSpan(
          style: const TextStyle(fontSize: 13, color: _textMuted),
          children: [
            const TextSpan(text: 'Already have an account? '),
            WidgetSpan(
              child: GestureDetector(
                onTap: () => Navigator.pushReplacement(
                    context, MaterialPageRoute(builder: (_) => const LoginScreen())),
                child: Row(mainAxisSize: MainAxisSize.min, children: const [
                  Icon(Icons.login_rounded, size: 13, color: _accentLight),
                  SizedBox(width: 4),
                  Text('Sign In',
                      style: TextStyle(color: _accentLight, fontSize: 13, fontWeight: FontWeight.w600)),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

enum _ImageSlot { profile, license, vehicle, todaClearance }