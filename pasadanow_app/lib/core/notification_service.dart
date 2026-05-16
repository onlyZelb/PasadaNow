// lib/core/notification_service.dart
//
// Drop this file into:  lib/core/notification_service.dart
//
// Usage in driver_home.dart / commuter_home.dart:
//   import '../core/notification_service.dart';   (or adjust path)
//
// Then:
//   final _notif = NotificationService();          // one instance per screen
//   _notif.add(AppNotification.rideBooked(...));   // push a notification
//   NotificationBell(service: _notif)              // drop into AppBar actions

import 'package:flutter/material.dart';

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION MODEL
// ─────────────────────────────────────────────────────────────────────────────

enum NotifType {
  rideBooked,
  rideAccepted,
  rideDeclined,
  rideCompleted,
  rideCancelled,
  driverOnline,
  driverOffline,
  newRideRequest,
  gpsLost,
  info,
}

class AppNotification {
  final String id;
  final NotifType type;
  final String title;
  final String body;
  final DateTime time;
  bool read;

  AppNotification({
    required this.type,
    required this.title,
    required this.body,
    DateTime? time,
    this.read = false,
  })  : id = DateTime.now().microsecondsSinceEpoch.toString(),
        time = time ?? DateTime.now();

  // ── Convenience constructors ──────────────────────────────────────────────

  factory AppNotification.rideBooked(String pickup, String destination) =>
      AppNotification(
        type: NotifType.rideBooked,
        title: 'Ride Booked!',
        body: '$pickup → $destination',
      );

  factory AppNotification.rideAccepted(String driverName) =>
      AppNotification(
        type: NotifType.rideAccepted,
        title: 'Driver Accepted',
        body: '$driverName is on the way to pick you up.',
      );

  factory AppNotification.rideDeclined() => AppNotification(
        type: NotifType.rideDeclined,
        title: 'Ride Declined',
        body: 'Driver declined your request. Please select another driver.',
      );

  factory AppNotification.rideCompleted(String fare) => AppNotification(
        type: NotifType.rideCompleted,
        title: 'Ride Completed',
        body: 'You have arrived. Total fare: $fare.',
      );

  factory AppNotification.rideCancelled() => AppNotification(
        type: NotifType.rideCancelled,
        title: 'Ride Cancelled',
        body: 'Your ride has been cancelled.',
      );

  factory AppNotification.newRideRequest(
          String passengerName, String pickup, String fare) =>
      AppNotification(
        type: NotifType.newRideRequest,
        title: 'New Ride Request',
        body: '$passengerName — $pickup ($fare)',
      );

  factory AppNotification.driverOnline() => AppNotification(
        type: NotifType.driverOnline,
        title: 'You are Online',
        body: 'Waiting for ride requests…',
      );

  factory AppNotification.driverOffline() => AppNotification(
        type: NotifType.driverOffline,
        title: 'You are Offline',
        body: 'You will not receive new ride requests.',
      );

  factory AppNotification.rideEarned(String fare) => AppNotification(
        type: NotifType.rideCompleted,
        title: 'Ride Completed',
        body: 'Earned $fare. Great job!',
      );

  // ── Display helpers ───────────────────────────────────────────────────────

  IconData get icon {
    switch (type) {
      case NotifType.rideBooked:
        return Icons.rocket_launch_outlined;
      case NotifType.rideAccepted:
        return Icons.check_circle_outline_rounded;
      case NotifType.rideDeclined:
        return Icons.cancel_outlined;
      case NotifType.rideCompleted:
        return Icons.flag_circle_outlined;
      case NotifType.rideCancelled:
        return Icons.remove_circle_outline;
      case NotifType.newRideRequest:
        return Icons.electric_rickshaw_outlined;
      case NotifType.driverOnline:
        return Icons.wifi_rounded;
      case NotifType.driverOffline:
        return Icons.wifi_off_rounded;
      case NotifType.gpsLost:
        return Icons.gps_off;
      case NotifType.info:
        return Icons.info_outline_rounded;
    }
  }

  Color iconColor(BuildContext context) {
    switch (type) {
      case NotifType.rideBooked:
      case NotifType.newRideRequest:
        return const Color(0xFF2D8CFF);
      case NotifType.rideAccepted:
      case NotifType.rideCompleted:
      case NotifType.driverOnline:
        return const Color(0xFF1DBE74);
      case NotifType.rideDeclined:
      case NotifType.rideCancelled:
      case NotifType.gpsLost:
        return const Color(0xFFEF4444);
      case NotifType.driverOffline:
      case NotifType.info:
        return const Color(0xFFF4A620);
    }
  }

  String get timeLabel {
    final diff = DateTime.now().difference(time);
    if (diff.inSeconds < 60) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION SERVICE  (plain Dart class — no ChangeNotifier needed)
// ─────────────────────────────────────────────────────────────────────────────

class NotificationService {
  final List<AppNotification> _items = [];
  final List<VoidCallback> _listeners = [];

  List<AppNotification> get all => List.unmodifiable(_items);
  int get unreadCount => _items.where((n) => !n.read).length;

  void add(AppNotification n) {
    _items.insert(0, n);
    if (_items.length > 50) _items.removeLast();
    _notifyListeners();
  }

  void markAllRead() {
    for (final n in _items) {
      n.read = true;
    }
    _notifyListeners();
  }

  void clear() {
    _items.clear();
    _notifyListeners();
  }

  void addListener(VoidCallback cb) => _listeners.add(cb);
  void removeListener(VoidCallback cb) => _listeners.remove(cb);
  void _notifyListeners() {
    for (final cb in _listeners) {
      cb();
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION BELL WIDGET  — drop into AppBar actions
// ─────────────────────────────────────────────────────────────────────────────

class NotificationBell extends StatefulWidget {
  final NotificationService service;
  final Color iconColor;
  final Color badgeColor;

  const NotificationBell({
    super.key,
    required this.service,
    this.iconColor = const Color(0xFFE8EEF4),
    this.badgeColor = const Color(0xFF2D8CFF),
  });

  @override
  State<NotificationBell> createState() => _NotificationBellState();
}

class _NotificationBellState extends State<NotificationBell>
    with SingleTickerProviderStateMixin {
  late AnimationController _shakeCtrl;
  late Animation<double> _shakeAnim;
  int _prevUnread = 0;

  @override
  void initState() {
    super.initState();
    _shakeCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 500));
    _shakeAnim = TweenSequence([
      TweenSequenceItem(tween: Tween(begin: 0.0, end: -0.15), weight: 1),
      TweenSequenceItem(tween: Tween(begin: -0.15, end: 0.15), weight: 2),
      TweenSequenceItem(tween: Tween(begin: 0.15, end: -0.10), weight: 2),
      TweenSequenceItem(tween: Tween(begin: -0.10, end: 0.10), weight: 2),
      TweenSequenceItem(tween: Tween(begin: 0.10, end: 0.0), weight: 1),
    ]).animate(CurvedAnimation(parent: _shakeCtrl, curve: Curves.easeInOut));

    widget.service.addListener(_onServiceUpdate);
    _prevUnread = widget.service.unreadCount;
  }

  void _onServiceUpdate() {
    if (!mounted) return;
    final current = widget.service.unreadCount;
    if (current > _prevUnread) {
      _shakeCtrl.forward(from: 0);
    }
    _prevUnread = current;
    setState(() {});
  }

  @override
  void dispose() {
    widget.service.removeListener(_onServiceUpdate);
    _shakeCtrl.dispose();
    super.dispose();
  }

  void _openDrawer() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => _NotificationDrawer(service: widget.service),
    ).then((_) {
      widget.service.markAllRead();
      if (mounted) setState(() {});
    });
  }

  @override
  Widget build(BuildContext context) {
    final unread = widget.service.unreadCount;

    return GestureDetector(
      onTap: _openDrawer,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4),
        child: AnimatedBuilder(
          animation: _shakeAnim,
          builder: (_, child) => Transform.rotate(
            angle: _shakeAnim.value,
            child: child,
          ),
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Icon(
                unread > 0
                    ? Icons.notifications_rounded
                    : Icons.notifications_outlined,
                color: unread > 0
                    ? widget.badgeColor
                    : widget.iconColor,
                size: 22,
              ),
              if (unread > 0)
                Positioned(
                  right: -4,
                  top: -4,
                  child: Container(
                    padding: const EdgeInsets.all(2),
                    constraints:
                        const BoxConstraints(minWidth: 16, minHeight: 16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEF4444),
                      shape: unread > 9
                          ? BoxShape.rectangle
                          : BoxShape.circle,
                      borderRadius:
                          unread > 9 ? BorderRadius.circular(8) : null,
                      border: Border.all(
                          color: const Color(0xFF0D1B2A), width: 1.5),
                    ),
                    child: Text(
                      unread > 99 ? '99+' : '$unread',
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 8,
                          fontWeight: FontWeight.w800,
                          height: 1),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION DRAWER
// ─────────────────────────────────────────────────────────────────────────────

class _NotificationDrawer extends StatefulWidget {
  final NotificationService service;
  const _NotificationDrawer({required this.service});

  @override
  State<_NotificationDrawer> createState() => _NotificationDrawerState();
}

class _NotificationDrawerState extends State<_NotificationDrawer> {
  static const _bg = Color(0xFF0D1B2A);
  static const _card = Color(0xFF16293D);
  static const _cardBorder = Color(0xFF1E3650);
  static const _accent = Color(0xFF2D8CFF);
  static const _textPrim = Color(0xFFE8EEF4);
  static const _textSub = Color(0xFF6B8BA4);
  static const _red = Color(0xFFEF4444);

  @override
  void initState() {
    super.initState();
    widget.service.addListener(_refresh);
  }

  @override
  void dispose() {
    widget.service.removeListener(_refresh);
    super.dispose();
  }

  void _refresh() {
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final items = widget.service.all;
    final screenH = MediaQuery.of(context).size.height;

    return Container(
      height: screenH * 0.72,
      decoration: const BoxDecoration(
        color: _bg,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        border: Border(
          top: BorderSide(color: _cardBorder, width: 1),
          left: BorderSide(color: _cardBorder, width: 1),
          right: BorderSide(color: _cardBorder, width: 1),
        ),
      ),
      child: Column(children: [
        // ── Handle ──────────────────────────────────────────────────────
        Center(
          child: Container(
            margin: const EdgeInsets.only(top: 10, bottom: 4),
            width: 36,
            height: 4,
            decoration: BoxDecoration(
              color: _cardBorder,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
        ),

        // ── Header ──────────────────────────────────────────────────────
        Padding(
          padding: const EdgeInsets.fromLTRB(18, 8, 12, 10),
          child: Row(children: [
            const Icon(Icons.notifications_rounded,
                color: _accent, size: 20),
            const SizedBox(width: 8),
            const Text(
              'Notifications',
              style: TextStyle(
                  color: _textPrim,
                  fontSize: 16,
                  fontWeight: FontWeight.w800),
            ),
            const SizedBox(width: 6),
            if (widget.service.unreadCount > 0)
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(
                  color: _red.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                      color: _red.withValues(alpha: 0.4)),
                ),
                child: Text(
                  '${widget.service.unreadCount} new',
                  style: const TextStyle(
                      color: _red,
                      fontSize: 10,
                      fontWeight: FontWeight.w700),
                ),
              ),
            const Spacer(),
            if (items.isNotEmpty)
              GestureDetector(
                onTap: () {
                  widget.service.clear();
                  setState(() {});
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: _cardBorder.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text(
                    'Clear all',
                    style: TextStyle(color: _textSub, fontSize: 11),
                  ),
                ),
              ),
          ]),
        ),

        const Divider(color: _cardBorder, height: 1),

        // ── List ────────────────────────────────────────────────────────
        Expanded(
          child: items.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.notifications_off_outlined,
                          color: _textSub.withValues(alpha: 0.4),
                          size: 48),
                      const SizedBox(height: 12),
                      const Text(
                        'No notifications yet',
                        style: TextStyle(
                            color: _textSub,
                            fontSize: 14,
                            fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Activity will appear here',
                        style:
                            TextStyle(color: _textSub, fontSize: 12),
                      ),
                    ],
                  ),
                )
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(14, 10, 14, 20),
                  itemCount: items.length,
                  separatorBuilder: (_, __) =>
                      const SizedBox(height: 8),
                  itemBuilder: (ctx, i) =>
                      _NotifTile(notif: items[i]),
                ),
        ),

        // ── Bottom safe area ────────────────────────────────────────────
        SizedBox(
            height: MediaQuery.of(context).padding.bottom + 8),
      ]),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SINGLE NOTIFICATION TILE
// ─────────────────────────────────────────────────────────────────────────────

class _NotifTile extends StatelessWidget {
  final AppNotification notif;

  const _NotifTile({required this.notif});

  static const _card = Color(0xFF16293D);
  static const _cardBorder = Color(0xFF1E3650);
  static const _textPrim = Color(0xFFE8EEF4);
  static const _textSub = Color(0xFF6B8BA4);

  @override
  Widget build(BuildContext context) {
    final color = notif.iconColor(context);

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: notif.read
            ? _card
            : color.withValues(alpha: 0.07),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: notif.read
              ? _cardBorder
              : color.withValues(alpha: 0.35),
          width: notif.read ? 1.0 : 1.5,
        ),
      ),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Icon bubble
        Container(
          width: 38,
          height: 38,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.15),
            shape: BoxShape.circle,
            border: Border.all(
                color: color.withValues(alpha: 0.3)),
          ),
          child: Center(
              child: Icon(notif.icon, color: color, size: 18)),
        ),
        const SizedBox(width: 10),

        // Text
        Expanded(
          child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Expanded(
                    child: Text(
                      notif.title,
                      style: TextStyle(
                        color: _textPrim,
                        fontSize: 13,
                        fontWeight: notif.read
                            ? FontWeight.w600
                            : FontWeight.w800,
                      ),
                    ),
                  ),
                  if (!notif.read)
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: color,
                        shape: BoxShape.circle,
                      ),
                    ),
                ]),
                const SizedBox(height: 3),
                Text(
                  notif.body,
                  style: const TextStyle(
                      color: _textSub, fontSize: 11, height: 1.4),
                ),
                const SizedBox(height: 5),
                Text(
                  notif.timeLabel,
                  style: TextStyle(
                      color: _textSub.withValues(alpha: 0.7),
                      fontSize: 9,
                      fontWeight: FontWeight.w600),
                ),
              ]),
        ),
      ]),
    );
  }
}