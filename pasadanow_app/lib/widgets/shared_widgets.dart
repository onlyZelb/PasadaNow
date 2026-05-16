import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

// ── Ride Status ────────────────────────────────────────────────────────────
enum RideStatus { completed, ongoing, cancelled }

// ── Status Badge ───────────────────────────────────────────────────────────
class StatusBadge extends StatelessWidget {
  final RideStatus status;
  const StatusBadge(this.status, {super.key});

  @override
  Widget build(BuildContext context) {
    final label = switch (status) {
      RideStatus.completed => 'Completed',
      RideStatus.ongoing   => 'Ongoing',
      RideStatus.cancelled => 'Cancelled',
    };
    final color = switch (status) {
      RideStatus.completed => AppColors.green,
      RideStatus.ongoing   => AppColors.accentLight,
      RideStatus.cancelled => AppColors.error,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        border: Border.all(color: color.withOpacity(0.35)),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: color,
        ),
      ),
    );
  }
}

// ── Pulsing Dot ────────────────────────────────────────────────────────────
class PulsingDot extends StatefulWidget {
  final Color color;
  final double size;
  const PulsingDot({super.key, required this.color, this.size = 8});

  @override
  State<PulsingDot> createState() => _PulsingDotState();
}

class _PulsingDotState extends State<PulsingDot>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 900))
      ..repeat(reverse: true);
    _anim = Tween<double>(begin: 0.4, end: 1.0)
        .animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _anim,
      child: Container(
        width: widget.size,
        height: widget.size,
        decoration: BoxDecoration(
          color: widget.color,
          shape: BoxShape.circle,
        ),
      ),
    );
  }
}

// ── Section Label ──────────────────────────────────────────────────────────
class SectionLabel extends StatelessWidget {
  final String text;
  final Color color;
  const SectionLabel(this.text,
      {super.key, this.color = AppColors.accentLight});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        border: Border.all(color: color.withOpacity(0.3)),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        text.toUpperCase(),
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: 1.5,
        ),
      ),
    );
  }
}

// ── App Card ───────────────────────────────────────────────────────────────
class AppCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  const AppCard({super.key, required this.child, this.padding});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding ?? const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.bgCard,
        border: Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(18),
      ),
      child: child,
    );
  }
}

// ── Primary Button ─────────────────────────────────────────────────────────
class PrimaryButton extends StatelessWidget {
  final String label;
  final String? emoji;
  final VoidCallback? onTap;
  final double? width;

  const PrimaryButton({
    super.key,
    required this.label,
    this.emoji,
    this.onTap,
    this.width,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: width,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 13),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF2563C8), AppColors.accent],
          ),
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: AppColors.accent.withOpacity(0.4),
              blurRadius: 14,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          mainAxisSize:
              width != null ? MainAxisSize.max : MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (emoji != null) ...[
              Text(emoji!, style: const TextStyle(fontSize: 16)),
              const SizedBox(width: 8),
            ],
            Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Ghost Button ───────────────────────────────────────────────────────────
class GhostButton extends StatelessWidget {
  final String label;
  final String? emoji;
  final VoidCallback? onTap;
  final Color? borderColor;
  final Color? textColor;

  const GhostButton({
    super.key,
    required this.label,
    this.emoji,
    this.onTap,
    this.borderColor,
    this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    final tc = textColor ?? AppColors.textPrimary;
    final bc = borderColor ?? AppColors.border;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 13),
        decoration: BoxDecoration(
          color: AppColors.inputBg,
          border: Border.all(color: bc),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (emoji != null) ...[
              Text(emoji!, style: const TextStyle(fontSize: 16)),
              const SizedBox(width: 8),
            ],
            Text(
              label,
              style: TextStyle(
                color: tc,
                fontSize: 14,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── App Input Field ────────────────────────────────────────────────────────
class AppInputField extends StatelessWidget {
  final String label;
  final String hint;
  final String? value;
  final String? leadingEmoji;
  final VoidCallback? onTap;

  const AppInputField({
    super.key,
    required this.label,
    required this.hint,
    this.value,
    this.leadingEmoji,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: AppColors.textMuted,
            ),
          ),
          const SizedBox(height: 6),
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 12, vertical: 13),
            decoration: BoxDecoration(
              color: AppColors.inputBg,
              border: Border.all(color: AppColors.border),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                if (leadingEmoji != null) ...[
                  Text(leadingEmoji!,
                      style: const TextStyle(fontSize: 16)),
                  const SizedBox(width: 10),
                ],
                Expanded(
                  child: Text(
                    value ?? hint,
                    style: TextStyle(
                      fontSize: 13,
                      color: value != null
                          ? AppColors.textPrimary
                          : AppColors.textMuted,
                    ),
                  ),
                ),
                const Icon(Icons.chevron_right_rounded,
                    size: 18, color: AppColors.textMuted),
              ],
            ),
          ),
        ],
      ),
    );
  }
}