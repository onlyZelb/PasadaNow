import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';

// ═══════════════════════════════════════════════════════════════
//  ENTRY POINT
// ═══════════════════════════════════════════════════════════════
// To use: Navigator.push(context, MaterialPageRoute(builder: (_) => const SettingsLegalScreen()));
//
// Or navigate directly to a sub-page:
//   SettingsLegalScreen.pushSettings(context)
//   SettingsLegalScreen.pushPrivacyPolicy(context)
//   SettingsLegalScreen.pushTerms(context)
//   SettingsLegalScreen.pushSafety(context)

// ═══════════════════════════════════════════════════════════════
//  THEME CONSTANTS
// ═══════════════════════════════════════════════════════════════
const _bg = Color(0xFF0B1225);
const _card = Color(0xFF131D35);
const _cardBorder = Color(0xFF1E2D4A);
const _accent = Color(0xFF3B82F6);
const _accentOrange = Color(0xFFFB923C);
const _textPrimary = Colors.white;
const _textSecondary = Color(0xFF8B9DC3);
const _divider = Color(0xFF1A2740);

// ═══════════════════════════════════════════════════════════════
//  ROOT — Settings & Legal Screen
// ═══════════════════════════════════════════════════════════════
class SettingsLegalScreen extends StatelessWidget {
  const SettingsLegalScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 20),
          children: [
            // Section label
            const Text(
              'MORE',
              style: TextStyle(
                color: _accent,
                fontSize: 11,
                fontWeight: FontWeight.w800,
                letterSpacing: 2.0,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'Settings & Legal',
              style: TextStyle(
                color: _textPrimary,
                fontSize: 26,
                fontWeight: FontWeight.w900,
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(height: 22),

            // Menu card
            Container(
              decoration: BoxDecoration(
                color: _card,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: _cardBorder),
              ),
              child: Column(
                children: [
                  _MenuItem(
                    icon: Icons.settings_outlined,
                    iconBg: const Color(0xFF1E3A5F),
                    iconColor: const Color(0xFF60A5FA),
                    label: 'Settings',
                    onTap: () => _push(context, const _SettingsPage()),
                    isFirst: true,
                  ),
                  _Divider(),
                  _MenuItem(
                    icon: Icons.lock_outline_rounded,
                    iconBg: const Color(0xFF3D2A00),
                    iconColor: const Color(0xFFFBBF24),
                    label: 'Privacy Policy',
                    onTap: () => _push(context, const _PrivacyPolicyPage()),
                  ),
                  _Divider(),
                  _MenuItem(
                    icon: Icons.description_outlined,
                    iconBg: const Color(0xFF1A2E1A),
                    iconColor: const Color(0xFF4ADE80),
                    label: 'Terms of Service',
                    onTap: () => _push(context, const _TermsOfServicePage()),
                  ),
                  _Divider(),
                  _MenuItem(
                    icon: Icons.shield_outlined,
                    iconBg: const Color(0xFF1E1A3D),
                    iconColor: const Color(0xFFA78BFA),
                    label: 'Safety Guidelines',
                    onTap: () => _push(context, const _SafetyGuidelinesPage()),
                    isLast: true,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _push(BuildContext ctx, Widget page) {
    Navigator.push(ctx, MaterialPageRoute(builder: (_) => page));
  }

  // ── Static helpers so HomeScreen can deep-link directly ──
  static void pushSettings(BuildContext ctx) =>
      Navigator.push(ctx, MaterialPageRoute(builder: (_) => const _SettingsPage()));

  static void pushPrivacyPolicy(BuildContext ctx) =>
      Navigator.push(ctx, MaterialPageRoute(builder: (_) => const _PrivacyPolicyPage()));

  static void pushTerms(BuildContext ctx) =>
      Navigator.push(ctx, MaterialPageRoute(builder: (_) => const _TermsOfServicePage()));

  static void pushSafety(BuildContext ctx) =>
      Navigator.push(ctx, MaterialPageRoute(builder: (_) => const _SafetyGuidelinesPage()));
}

// ═══════════════════════════════════════════════════════════════
//  SHARED WIDGETS
// ═══════════════════════════════════════════════════════════════
class _MenuItem extends StatelessWidget {
  final IconData icon;
  final Color iconBg;
  final Color iconColor;
  final String label;
  final VoidCallback onTap;
  final bool isFirst;
  final bool isLast;

  const _MenuItem({
    required this.icon,
    required this.iconBg,
    required this.iconColor,
    required this.label,
    required this.onTap,
    this.isFirst = false,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.vertical(
          top: isFirst ? const Radius.circular(18) : Radius.zero,
          bottom: isLast ? const Radius.circular(18) : Radius.zero,
        ),
        splashColor: _accent.withOpacity(0.08),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: iconBg,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: iconColor, size: 20),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Text(
                  label,
                  style: const TextStyle(
                    color: _textPrimary,
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const Icon(Icons.chevron_right_rounded,
                  color: _textSecondary, size: 20),
            ],
          ),
        ),
      ),
    );
  }
}

class _Divider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return const Divider(
      height: 1,
      thickness: 1,
      color: _divider,
      indent: 68,
      endIndent: 0,
    );
  }
}

// ── Shared page scaffold ──────────────────────────────────────
class _PageShell extends StatelessWidget {
  final String title;
  final Widget child;
  final Color accentColor;

  const _PageShell({
    required this.title,
    required this.child,
    this.accentColor = _accent,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: _bg,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded,
              color: _textPrimary, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          title,
          style: const TextStyle(
            color: _textPrimary,
            fontSize: 17,
            fontWeight: FontWeight.w700,
          ),
        ),
        centerTitle: true,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: _cardBorder),
        ),
      ),
      body: child,
    );
  }
}

// ── Section + paragraph helpers ───────────────────────────────
class _Section extends StatelessWidget {
  final String title;
  final String body;

  const _Section({required this.title, required this.body});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 22),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: const TextStyle(
                color: _textPrimary,
                fontSize: 15,
                fontWeight: FontWeight.w800,
              )),
          const SizedBox(height: 8),
          Text(body,
              style: const TextStyle(
                color: _textSecondary,
                fontSize: 13.5,
                height: 1.75,
              )),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════
//  1. SETTINGS PAGE
// ═══════════════════════════════════════════════════════════════
class _SettingsPage extends StatefulWidget {
  const _SettingsPage();

  @override
  State<_SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<_SettingsPage> {
  bool _notifications = true;
  bool _locationAlways = false;
  bool _rideHistory = true;
  bool _promoEmails = false;
  bool _darkMode = true;
  String _language = 'English';
  String _currency = 'PHP (₱)';

  @override
  Widget build(BuildContext context) {
    return _PageShell(
      title: 'Settings',
      child: ListView(
        padding: const EdgeInsets.all(18),
        children: [
          _settingsGroup(
            label: 'ACCOUNT',
            children: [
              _SettingsTile(
                icon: Icons.person_outline_rounded,
                iconBg: const Color(0xFF1E3A5F),
                iconColor: const Color(0xFF60A5FA),
                label: 'Edit Profile',
                trailing: const Icon(Icons.chevron_right_rounded,
                    color: _textSecondary, size: 20),
                onTap: () => _showEditProfile(context),
              ),
              _SettingsTile(
                icon: Icons.lock_outline_rounded,
                iconBg: const Color(0xFF3D2A00),
                iconColor: const Color(0xFFFBBF24),
                label: 'Change Password',
                trailing: const Icon(Icons.chevron_right_rounded,
                    color: _textSecondary, size: 20),
                onTap: () => _showChangePassword(context),
              ),
              _SettingsTile(
                icon: Icons.language_rounded,
                iconBg: const Color(0xFF1A2E1A),
                iconColor: const Color(0xFF4ADE80),
                label: 'Language',
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(_language,
                        style: const TextStyle(
                            color: _textSecondary, fontSize: 13)),
                    const SizedBox(width: 4),
                    const Icon(Icons.chevron_right_rounded,
                        color: _textSecondary, size: 20),
                  ],
                ),
                onTap: () => _showLanguagePicker(context),
              ),
              _SettingsTile(
                icon: Icons.attach_money_rounded,
                iconBg: const Color(0xFF1E1A3D),
                iconColor: const Color(0xFFA78BFA),
                label: 'Currency',
                isLast: true,
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(_currency,
                        style: const TextStyle(
                            color: _textSecondary, fontSize: 13)),
                    const SizedBox(width: 4),
                    const Icon(Icons.chevron_right_rounded,
                        color: _textSecondary, size: 20),
                  ],
                ),
                onTap: () => _showCurrencyPicker(context),
              ),
            ],
          ),
          const SizedBox(height: 18),
          _settingsGroup(
            label: 'NOTIFICATIONS',
            children: [
              _SettingsTile(
                icon: Icons.notifications_outlined,
                iconBg: const Color(0xFF1E3A5F),
                iconColor: const Color(0xFF60A5FA),
                label: 'Push Notifications',
                trailing: _toggle(_notifications,
                    (v) => setState(() => _notifications = v)),
              ),
              _SettingsTile(
                icon: Icons.mail_outline_rounded,
                iconBg: const Color(0xFF3D2A00),
                iconColor: const Color(0xFFFBBF24),
                label: 'Promo Emails',
                isLast: true,
                trailing: _toggle(
                    _promoEmails, (v) => setState(() => _promoEmails = v)),
              ),
            ],
          ),
          const SizedBox(height: 18),
          _settingsGroup(
            label: 'PRIVACY',
            children: [
              _SettingsTile(
                icon: Icons.location_on_outlined,
                iconBg: const Color(0xFF1A2E1A),
                iconColor: const Color(0xFF4ADE80),
                label: 'Always-On Location',
                trailing: _toggle(_locationAlways,
                    (v) => setState(() => _locationAlways = v)),
              ),
              _SettingsTile(
                icon: Icons.history_rounded,
                iconBg: const Color(0xFF1E1A3D),
                iconColor: const Color(0xFFA78BFA),
                label: 'Save Ride History',
                isLast: true,
                trailing: _toggle(
                    _rideHistory, (v) => setState(() => _rideHistory = v)),
              ),
            ],
          ),
          const SizedBox(height: 18),
          _settingsGroup(
            label: 'DISPLAY',
            children: [
              _SettingsTile(
                icon: Icons.dark_mode_outlined,
                iconBg: const Color(0xFF1E3A5F),
                iconColor: const Color(0xFF60A5FA),
                label: 'Dark Mode',
                isLast: true,
                trailing:
                    _toggle(_darkMode, (v) => setState(() => _darkMode = v)),
              ),
            ],
          ),
          const SizedBox(height: 18),
          _settingsGroup(
            label: 'DANGER ZONE',
            children: [
              _SettingsTile(
                icon: Icons.logout_rounded,
                iconBg: const Color(0xFF3D0A0A),
                iconColor: const Color(0xFFF87171),
                label: 'Log Out',
                trailing: const Icon(Icons.chevron_right_rounded,
                    color: _textSecondary, size: 20),
                onTap: () => _confirmLogout(context),
              ),
              _SettingsTile(
                icon: Icons.delete_outline_rounded,
                iconBg: const Color(0xFF3D0A0A),
                iconColor: const Color(0xFFF87171),
                label: 'Delete Account',
                isLast: true,
                trailing: const Icon(Icons.chevron_right_rounded,
                    color: _textSecondary, size: 20),
                onTap: () => _confirmDelete(context),
              ),
            ],
          ),
          const SizedBox(height: 30),
          Center(
            child: Text('PasadaNow v1.0.0',
                style: TextStyle(
                    color: _textSecondary.withOpacity(0.5), fontSize: 12)),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _settingsGroup(
      {required String label, required List<Widget> children}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(
              color: _accent,
              fontSize: 10,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.8,
            )),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: _card,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: _cardBorder),
          ),
          child: Column(children: children),
        ),
      ],
    );
  }

  Widget _toggle(bool value, ValueChanged<bool> onChanged) {
    return Transform.scale(
      scale: 0.85,
      child: CupertinoSwitch(
        value: value,
        onChanged: onChanged,
        activeColor: _accent,
      ),
    );
  }

  void _showEditProfile(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: _card,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(22))),
      isScrollControlled: true,
      builder: (_) => Padding(
        padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            left: 24,
            right: 24,
            top: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Edit Profile',
                style: TextStyle(
                    color: _textPrimary,
                    fontSize: 18,
                    fontWeight: FontWeight.w800)),
            const SizedBox(height: 20),
            _inputField('Full Name', 'Juan dela Cruz'),
            const SizedBox(height: 12),
            _inputField('Phone', '+63 912 345 6789'),
            const SizedBox(height: 12),
            _inputField('Email', 'juan@example.com'),
            const SizedBox(height: 20),
            _primaryButton('Save Changes', () => Navigator.pop(context)),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  void _showChangePassword(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: _card,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(22))),
      isScrollControlled: true,
      builder: (_) => Padding(
        padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            left: 24,
            right: 24,
            top: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Change Password',
                style: TextStyle(
                    color: _textPrimary,
                    fontSize: 18,
                    fontWeight: FontWeight.w800)),
            const SizedBox(height: 20),
            _inputField('Current Password', '••••••••', obscure: true),
            const SizedBox(height: 12),
            _inputField('New Password', '••••••••', obscure: true),
            const SizedBox(height: 12),
            _inputField('Confirm New Password', '••••••••', obscure: true),
            const SizedBox(height: 20),
            _primaryButton('Update Password', () => Navigator.pop(context)),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  void _showLanguagePicker(BuildContext context) {
    final langs = ['English', 'Filipino', 'Cebuano', 'Ilocano'];
    showModalBottomSheet(
      context: context,
      backgroundColor: _card,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(22))),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Select Language',
                style: TextStyle(
                    color: _textPrimary,
                    fontSize: 18,
                    fontWeight: FontWeight.w800)),
            const SizedBox(height: 16),
            ...langs.map((l) => ListTile(
                  title: Text(l,
                      style: const TextStyle(color: _textPrimary)),
                  trailing: _language == l
                      ? const Icon(Icons.check_circle_rounded,
                          color: _accent)
                      : null,
                  onTap: () {
                    setState(() => _language = l);
                    Navigator.pop(context);
                  },
                )),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  void _showCurrencyPicker(BuildContext context) {
    final currencies = ['PHP (₱)', 'USD (\$)', 'EUR (€)', 'JPY (¥)'];
    showModalBottomSheet(
      context: context,
      backgroundColor: _card,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(22))),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Select Currency',
                style: TextStyle(
                    color: _textPrimary,
                    fontSize: 18,
                    fontWeight: FontWeight.w800)),
            const SizedBox(height: 16),
            ...currencies.map((c) => ListTile(
                  title: Text(c,
                      style: const TextStyle(color: _textPrimary)),
                  trailing: _currency == c
                      ? const Icon(Icons.check_circle_rounded,
                          color: _accent)
                      : null,
                  onTap: () {
                    setState(() => _currency = c);
                    Navigator.pop(context);
                  },
                )),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  void _confirmLogout(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: _card,
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: const Text('Log Out',
            style:
                TextStyle(color: _textPrimary, fontWeight: FontWeight.w800)),
        content: const Text('Are you sure you want to log out?',
            style: TextStyle(color: _textSecondary)),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel',
                  style: TextStyle(color: _textSecondary))),
          TextButton(
              onPressed: () {
                Navigator.pop(context);
                // TODO: call your auth logout
              },
              child: const Text('Log Out',
                  style: TextStyle(
                      color: Color(0xFFF87171),
                      fontWeight: FontWeight.w700))),
        ],
      ),
    );
  }

  void _confirmDelete(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: _card,
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: const Text('Delete Account',
            style:
                TextStyle(color: _textPrimary, fontWeight: FontWeight.w800)),
        content: const Text(
            'This action is permanent and cannot be undone. All your data will be erased.',
            style: TextStyle(color: _textSecondary)),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel',
                  style: TextStyle(color: _textSecondary))),
          TextButton(
              onPressed: () {
                Navigator.pop(context);
                // TODO: call your delete account API
              },
              child: const Text('Delete',
                  style: TextStyle(
                      color: Color(0xFFF87171),
                      fontWeight: FontWeight.w700))),
        ],
      ),
    );
  }
}

// ── Settings tile ─────────────────────────────────────────────
class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final Color iconBg;
  final Color iconColor;
  final String label;
  final Widget trailing;
  final VoidCallback? onTap;
  final bool isLast;

  const _SettingsTile({
    required this.icon,
    required this.iconBg,
    required this.iconColor,
    required this.label,
    required this.trailing,
    this.onTap,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            borderRadius: isLast
                ? const BorderRadius.vertical(bottom: Radius.circular(16))
                : BorderRadius.zero,
            splashColor: _accent.withOpacity(0.06),
            child: Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
              child: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: iconBg,
                      borderRadius: BorderRadius.circular(9),
                    ),
                    child: Icon(icon, color: iconColor, size: 18),
                  ),
                  const SizedBox(width: 13),
                  Expanded(
                    child: Text(label,
                        style: const TextStyle(
                            color: _textPrimary,
                            fontSize: 14,
                            fontWeight: FontWeight.w600)),
                  ),
                  trailing,
                ],
              ),
            ),
          ),
        ),
        if (!isLast)
          const Divider(
              height: 1, thickness: 1, color: _divider, indent: 63),
      ],
    );
  }
}

// ═══════════════════════════════════════════════════════════════
//  2. PRIVACY POLICY PAGE
// ═══════════════════════════════════════════════════════════════
class _PrivacyPolicyPage extends StatelessWidget {
  const _PrivacyPolicyPage();

  @override
  Widget build(BuildContext context) {
    return _PageShell(
      title: 'Privacy Policy',
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _legalHeader(
            icon: Icons.lock_outline_rounded,
            iconColor: const Color(0xFFFBBF24),
            iconBg: const Color(0xFF3D2A00),
            lastUpdated: 'Last updated: April 2026',
          ),
          const SizedBox(height: 24),
          const _Section(
            title: 'Introduction',
            body:
                'Welcome to PasadaNow. This document serves as the formal User Agreement between you (the "User") and the PasadaNow platform. By accessing our web or mobile-based ride-hailing system, you legally acknowledge that you have read, understood, and agreed to the terms set forth below.',
          ),
          const _Section(
            title: 'What We Collect',
            body:
                'We collect personal identifiers including your Name and Contact Number, as well as real-time Geolocation (GPS) data while the service is active. This information is necessary to provide core platform functionality.',
          ),
          const _Section(
            title: 'How We Use Your Data',
            body:
                'Your data is used exclusively for ride-matching, fare calculation, and safety verification. We do not use your personal information for advertising or sell it to third parties under any circumstance.',
          ),
          const _Section(
            title: 'Data Storage & Security',
            body:
                'Credentials such as passwords are encrypted using industry-standard password_hash protocols. We implement appropriate technical and organizational measures to protect your personal data against unauthorized access or disclosure.',
          ),
          const _Section(
            title: 'Third-Party Sharing',
            body:
                'We do not sell user data. Personal information is shared only between the matched Driver and Passenger for the duration of an active service session. No data is disclosed to unrelated third parties.',
          ),
          const _Section(
            title: 'Your Rights',
            body:
                'You have the right to access, correct, or request deletion of your personal data at any time through the Settings page. For further inquiries, contact us at privacy@pasadanow.ph.',
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════
//  3. TERMS OF SERVICE PAGE
// ═══════════════════════════════════════════════════════════════
class _TermsOfServicePage extends StatelessWidget {
  const _TermsOfServicePage();

  @override
  Widget build(BuildContext context) {
    return _PageShell(
      title: 'Terms of Service',
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _legalHeader(
            icon: Icons.description_outlined,
            iconColor: const Color(0xFF4ADE80),
            iconBg: const Color(0xFF1A2E1A),
            lastUpdated: 'Last updated: April 2026',
          ),
          const SizedBox(height: 24),
          const _Section(
            title: 'User Agreement',
            body:
                'Welcome to PasadaNow. This document serves as the formal User Agreement between you (the "User") and the PasadaNow platform. By accessing our web or mobile-based ride-hailing system, you legally acknowledge that you have read, understood, and agreed to the terms and conditions set forth below. These terms govern your access to our ride-matching technology and our handling of your personal data.',
          ),
          const _Section(
            title: 'Nature of Service',
            body:
                'PasadaNow is a technology provider and does not function as a transportation company. We provide a digital marketplace to connect independent tricycle drivers with passengers. All transport agreements are strictly between the Driver and the Passenger.',
          ),
          const _Section(
            title: 'Data Collection & Privacy',
            body:
                'We are committed to the secure handling of User data. We collect personal identifiers (Name, Contact Number) and real-time Geolocation (GPS) data.\n\n• Purpose: Data is used for ride-matching, fare calculation, and safety verification.\n• Storage: Credentials such as passwords are encrypted via password_hash protocols.\n• Third Parties: We do not sell user data. Data is shared only between the matched Driver and Passenger for the duration of the service.',
          ),
          const _Section(
            title: 'Fares & Payments',
            body:
                'Fares are generated by a pre-defined algorithm based on distance and local community guidelines. By requesting a ride, the Passenger agrees to pay the calculated fare. PasadaNow is not liable for disputes arising from cash transactions between users.',
          ),
          const _Section(
            title: 'Limitation of Liability',
            body:
                'To the maximum extent permitted by law, PasadaNow shall not be held responsible for any personal injury, property loss, or damages occurring during a trip. Users utilize the system and the transportation services at their own risk.',
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════
//  4. SAFETY GUIDELINES PAGE
// ═══════════════════════════════════════════════════════════════
class _SafetyGuidelinesPage extends StatelessWidget {
  const _SafetyGuidelinesPage();

  @override
  Widget build(BuildContext context) {
    return _PageShell(
      title: 'Safety Guidelines',
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _legalHeader(
            icon: Icons.shield_outlined,
            iconColor: const Color(0xFFA78BFA),
            iconBg: const Color(0xFF1E1A3D),
            lastUpdated: 'Updated regularly for your protection',
          ),
          const SizedBox(height: 24),

          // Safety tips cards
          _SafetyCard(
            icon: Icons.verified_user_outlined,
            color: const Color(0xFF4ADE80),
            title: 'Verify Your Driver',
            body:
                'Always confirm the driver\'s name, photo, and plate number in the app before entering the vehicle. Never ride with someone whose details don\'t match.',
          ),
          _SafetyCard(
            icon: Icons.share_location_outlined,
            color: const Color(0xFF60A5FA),
            title: 'Share Your Trip',
            body:
                'Use the "Share Trip" feature to send your live location and driver details to a trusted contact. This is enabled by default for all rides.',
          ),
          _SafetyCard(
            icon: Icons.front_hand_outlined,
            color: const Color(0xFFFBBF24),
            title: 'Trust Your Instincts',
            body:
                'If anything feels wrong, you have the right to cancel or end the ride. Move to a safe, public place and contact emergency services if needed.',
          ),
          _SafetyCard(
            icon: Icons.no_drinks_outlined,
            color: const Color(0xFFF87171),
            title: 'Community Standards',
            body:
                'No alcohol, smoking, or illegal substances inside vehicles. Harassment of any kind — verbal or physical — results in immediate permanent ban.',
          ),
          _SafetyCard(
            icon: Icons.emergency_outlined,
            color: const Color(0xFFF87171),
            title: 'Emergency SOS',
            body:
                'Press and hold the shield icon during any ride to trigger an emergency alert that shares your location with local authorities and our safety team.',
          ),
          _SafetyCard(
            icon: Icons.rate_review_outlined,
            color: const Color(0xFFA78BFA),
            title: 'Rate Every Ride',
            body:
                'Your ratings keep the community safe. A low rating prompts a safety review. You can also report incidents directly from your ride history.',
          ),

          const SizedBox(height: 20),

          // Emergency contacts
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: const Color(0xFF3D0A0A).withOpacity(0.5),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFF87171).withOpacity(0.3)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.emergency_rounded,
                        color: Color(0xFFF87171), size: 18),
                    SizedBox(width: 8),
                    Text('Emergency Contacts',
                        style: TextStyle(
                            color: Color(0xFFF87171),
                            fontWeight: FontWeight.w800,
                            fontSize: 14)),
                  ],
                ),
                const SizedBox(height: 12),
                _emergencyLine('PNP Hotline', '117'),
                _emergencyLine('BJMP Emergency', '0917-BJMP-911'),
                _emergencyLine('PasadaNow Safety', '1-800-PASADA-NOW'),
              ],
            ),
          ),
          const SizedBox(height: 30),
        ],
      ),
    );
  }

  Widget _emergencyLine(String label, String number) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Expanded(
              child: Text(label,
                  style: const TextStyle(
                      color: _textSecondary, fontSize: 13))),
          Text(number,
              style: const TextStyle(
                  color: _textPrimary,
                  fontSize: 13,
                  fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}

class _SafetyCard extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String title;
  final String body;

  const _SafetyCard({
    required this.icon,
    required this.color,
    required this.title,
    required this.body,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: _cardBorder),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: color.withOpacity(0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 13),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: const TextStyle(
                        color: _textPrimary,
                        fontSize: 14,
                        fontWeight: FontWeight.w700)),
                const SizedBox(height: 5),
                Text(body,
                    style: const TextStyle(
                        color: _textSecondary,
                        fontSize: 12.5,
                        height: 1.65)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════
//  SHARED HELPERS
// ═══════════════════════════════════════════════════════════════
Widget _legalHeader({
  required IconData icon,
  required Color iconColor,
  required Color iconBg,
  required String lastUpdated,
}) {
  return Container(
    padding: const EdgeInsets.all(18),
    decoration: BoxDecoration(
      color: _card,
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: _cardBorder),
    ),
    child: Row(
      children: [
        Container(
          width: 46,
          height: 46,
          decoration: BoxDecoration(
            color: iconBg,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: iconColor, size: 24),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('PasadaNow',
                  style: TextStyle(
                      color: _textPrimary,
                      fontWeight: FontWeight.w800,
                      fontSize: 15)),
              const SizedBox(height: 3),
              Text(lastUpdated,
                  style: const TextStyle(
                      color: _textSecondary, fontSize: 12)),
            ],
          ),
        ),
      ],
    ),
  );
}

Widget _inputField(String label, String hint, {bool obscure = false}) {
  return Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(label,
          style: const TextStyle(
              color: _textSecondary,
              fontSize: 12,
              fontWeight: FontWeight.w600)),
      const SizedBox(height: 6),
      TextField(
        obscureText: obscure,
        style: const TextStyle(color: _textPrimary, fontSize: 14),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(color: _textSecondary.withOpacity(0.5)),
          filled: true,
          fillColor: _bg,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: _cardBorder),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: _cardBorder),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: _accent, width: 1.5),
          ),
        ),
      ),
    ],
  );
}

Widget _primaryButton(String label, VoidCallback onTap) {
  return GestureDetector(
    onTap: onTap,
    child: Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 15),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
            colors: [Color(0xFF2563EB), Color(0xFF60A5FA)]),
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
              color: _accent.withOpacity(0.4),
              blurRadius: 20,
              offset: const Offset(0, 6)),
        ],
      ),
      child: Center(
        child: Text(label,
            style: const TextStyle(
                color: Colors.white,
                fontSize: 15,
                fontWeight: FontWeight.w800)),
      ),
    ),
  );
}