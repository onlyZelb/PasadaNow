import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:http/http.dart' as http;
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../core/api_client.dart';
import '../../core/constants.dart';
import '../../widgets/chat_widget.dart';
import '../../core/notification_service.dart';
import '../login_screen.dart';

// ─────────────────────────────────────────────────────────────────────────────
// THEME COLORS
// ─────────────────────────────────────────────────────────────────────────────

class AppThemeColors {
  final Color bgDeep;
  final Color bgCard;
  final Color accent;
  final Color green;
  final Color orange;
  final Color red;
  final Color textPrimary;
  final Color textMuted;
  final Color border;
  final Color appBarBg;
  final Color mapOverlayBg;

  const AppThemeColors({
    required this.bgDeep,
    required this.bgCard,
    required this.accent,
    required this.green,
    required this.orange,
    required this.red,
    required this.textPrimary,
    required this.textMuted,
    required this.border,
    required this.appBarBg,
    required this.mapOverlayBg,
  });

  static const dark = AppThemeColors(
    bgDeep: Color(0xFF0B1B35),
    bgCard: Color(0xFF102245),
    accent: Color(0xFF3D7FD4),
    green: Color(0xFF22C55E),
    orange: Color(0xFFE8863A),
    red: Color(0xFFEF4444),
    textPrimary: Color(0xFFE8EEF7),
    textMuted: Color(0xFF8A9BC0),
    border: Color(0xFF1E3A6E),
    appBarBg: Color(0xFF0D1A30),
    mapOverlayBg: Color(0xFF0D1A30),
  );

  static const light = AppThemeColors(
    bgDeep: Color(0xFFF0F4FA),
    bgCard: Color(0xFFFFFFFF),
    accent: Color(0xFF2563EB),
    green: Color(0xFF16A34A),
    orange: Color(0xFFD97706),
    red: Color(0xFFDC2626),
    textPrimary: Color(0xFF0F172A),
    textMuted: Color(0xFF64748B),
    border: Color(0xFFCBD5E1),
    appBarBg: Color(0xFFFFFFFF),
    mapOverlayBg: Color(0xFFFFFFFF),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// THEME PROVIDER
// ─────────────────────────────────────────────────────────────────────────────

class ThemeProvider extends ChangeNotifier {
  bool _isDark = true;
  bool get isDark => _isDark;
  AppThemeColors get colors =>
      _isDark ? AppThemeColors.dark : AppThemeColors.light;

  void toggle() {
    _isDark = !_isDark;
    notifyListeners();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FARE CONFIG MODEL
// ─────────────────────────────────────────────────────────────────────────────

class FareConfig {
  final double baseFare;
  final double perKmRate;
  final double minimumFare;
  final double bookingFee;
  final double surgeMultiplier;
  final bool surgeEnabled;

  const FareConfig({
    required this.baseFare,
    required this.perKmRate,
    required this.minimumFare,
    required this.bookingFee,
    required this.surgeMultiplier,
    required this.surgeEnabled,
  });

  factory FareConfig.defaults() => const FareConfig(
        baseFare: 15.0,
        perKmRate: 8.0,
        minimumFare: 15.0,
        bookingFee: 0.0,
        surgeMultiplier: 1.0,
        surgeEnabled: false,
      );

  factory FareConfig.fromJson(Map<String, dynamic> json) {
    double _d(dynamic v, double fallback) =>
        v == null ? fallback : (double.tryParse(v.toString()) ?? fallback);
    return FareConfig(
      baseFare: _d(json['base_fare'], 15.0),
      perKmRate: _d(json['per_km_rate'], 8.0),
      minimumFare: _d(json['minimum_fare'], 15.0),
      bookingFee: _d(json['booking_fee'], 0.0),
      surgeMultiplier: _d(json['surge_multiplier'], 1.0),
      surgeEnabled: json['surge_enabled'] == true || json['surge_enabled'] == 1,
    );
  }

  double computeFare(double distanceKm) {
    final multiplier = surgeEnabled ? surgeMultiplier : 1.0;
    final computed =
        (baseFare + perKmRate * distanceKm) * multiplier + bookingFee;
    return computed < minimumFare ? minimumFare : computed;
  }

  String computeFareString(double distanceKm) =>
      '₱${computeFare(distanceKm).toStringAsFixed(2)}';
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA MODEL
// ─────────────────────────────────────────────────────────────────────────────

class RideRequest {
  final int id;
  final String passengerName;
  final LatLng pickup;
  final LatLng dropoff;
  final String pickupLabel;
  final String dropoffLabel;
  final double fare;
  final double distanceKm;

  const RideRequest({
    required this.id,
    required this.passengerName,
    required this.pickup,
    required this.dropoff,
    required this.pickupLabel,
    required this.dropoffLabel,
    required this.fare,
    required this.distanceKm,
  });

  factory RideRequest.fromJson(Map<String, dynamic> json) {
    final pickupLat =
        (json['pickup_lat'] ?? json['pickup_latitude'] ?? 0.0) as num;
    final pickupLng =
        (json['pickup_lng'] ?? json['pickup_longitude'] ?? 0.0) as num;
    final dropoffLat =
        (json['dropoff_lat'] ?? json['dropoff_latitude'] ?? 0.0) as num;
    final dropoffLng =
        (json['dropoff_lng'] ?? json['dropoff_longitude'] ?? 0.0) as num;

    final fareRaw = json['fare'];
    final double fare = fareRaw is num
        ? fareRaw.toDouble()
        : double.tryParse(fareRaw?.toString() ?? '0') ?? 0.0;

    final passengerName = json['passenger_name']?.toString()?.isNotEmpty == true
        ? json['passenger_name'].toString()
        : json['commuter_name']?.toString()?.isNotEmpty == true
            ? json['commuter_name'].toString()
            : json['name']?.toString()?.isNotEmpty == true
                ? json['name'].toString()
                : json['username']?.toString()?.isNotEmpty == true
                    ? json['username'].toString()
                    : json['user_name']?.toString()?.isNotEmpty == true
                        ? json['user_name'].toString()
                        : json['commuter']?.toString()?.isNotEmpty == true
                            ? json['commuter'].toString()
                            : json['full_name']?.toString()?.isNotEmpty == true
                                ? json['full_name'].toString()
                                : json['rider_name']?.toString()?.isNotEmpty ==
                                        true
                                    ? json['rider_name'].toString()
                                    : 'Passenger';

    final distRaw = json['distance_km'] ??
        json['distance'] ??
        json['dist_km'] ??
        json['km'] ??
        json['route_distance'];
    final double distanceKm = distRaw is num
        ? distRaw.toDouble()
        : double.tryParse(distRaw?.toString() ?? '0') ?? 0.0;

    final pickupLabel = json['pickup_location']?.toString()?.isNotEmpty == true
        ? json['pickup_location'].toString()
        : json['pickup_label']?.toString()?.isNotEmpty == true
            ? json['pickup_label'].toString()
            : json['pickup']?.toString()?.isNotEmpty == true
                ? json['pickup'].toString()
                : json['from']?.toString() ?? '';

    final dropoffLabel = json['destination']?.toString()?.isNotEmpty == true
        ? json['destination'].toString()
        : json['dropoff_label']?.toString()?.isNotEmpty == true
            ? json['dropoff_label'].toString()
            : json['dropoff']?.toString()?.isNotEmpty == true
                ? json['dropoff'].toString()
                : json['to']?.toString() ?? '';

    return RideRequest(
      id: (json['id'] as num).toInt(),
      passengerName: passengerName,
      pickup: LatLng(pickupLat.toDouble(), pickupLng.toDouble()),
      dropoff: LatLng(dropoffLat.toDouble(), dropoffLng.toDouble()),
      pickupLabel: pickupLabel,
      dropoffLabel: dropoffLabel,
      fare: fare,
      distanceKm: distanceKm,
    );
  }

  bool get hasValidPickup => pickup.latitude != 0 || pickup.longitude != 0;
  bool get hasValidDropoff => dropoff.latitude != 0 || dropoff.longitude != 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// DRIVER PROFILE MODEL
// ─────────────────────────────────────────────────────────────────────────────

class DriverProfile {
  final String username;
  final String fullName;
  final String phone;
  final String email;
  final String address;
  final String age;
  final String plateNumber;
  final String licenseNumber;
  final String organization;
  final String contact;
  final String? profilePhotoUrl;
  final String? licensePhotoUrl;
  final String? vehiclePhotoUrl;
  final String? todaPhotoUrl;

  const DriverProfile({
    required this.username,
    required this.fullName,
    required this.phone,
    required this.email,
    required this.address,
    required this.age,
    required this.plateNumber,
    required this.licenseNumber,
    required this.organization,
    required this.contact,
    this.profilePhotoUrl,
    this.licensePhotoUrl,
    this.vehiclePhotoUrl,
    this.todaPhotoUrl,
  });

  factory DriverProfile.fromJson(Map<String, dynamic> json) {
    return DriverProfile(
      username: json['username']?.toString() ?? '',
      fullName:
          json['full_name']?.toString() ?? json['fullName']?.toString() ?? '',
      phone: json['phone']?.toString() ?? json['contact']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      address: json['address']?.toString() ?? '',
      age: json['age']?.toString() ?? '',
      plateNumber: json['plate_number']?.toString() ?? '',
      licenseNumber: json['license_number']?.toString() ?? '',
      organization: json['organization']?.toString() ?? '',
      contact: json['contact']?.toString() ?? json['phone']?.toString() ?? '',
      profilePhotoUrl:
          json['profile_photo']?.toString() ?? json['profilePhoto']?.toString(),
      licensePhotoUrl:
          json['photo_license']?.toString() ?? json['licensePhoto']?.toString(),
      vehiclePhotoUrl:
          json['photo_plate']?.toString() ?? json['vehiclePhoto']?.toString(),
      todaPhotoUrl:
          json['photo_toda']?.toString() ?? json['todaPhoto']?.toString(),
    );
  }

  DriverProfile copyWith({
    String? fullName,
    String? phone,
    String? email,
    String? address,
    String? age,
    String? plateNumber,
    String? licenseNumber,
    String? organization,
    String? contact,
    String? profilePhotoUrl,
    String? licensePhotoUrl,
    String? vehiclePhotoUrl,
    String? todaPhotoUrl,
  }) {
    return DriverProfile(
      username: username,
      fullName: fullName ?? this.fullName,
      phone: phone ?? this.phone,
      email: email ?? this.email,
      address: address ?? this.address,
      age: age ?? this.age,
      plateNumber: plateNumber ?? this.plateNumber,
      licenseNumber: licenseNumber ?? this.licenseNumber,
      organization: organization ?? this.organization,
      contact: contact ?? this.contact,
      profilePhotoUrl: profilePhotoUrl ?? this.profilePhotoUrl,
      licensePhotoUrl: licensePhotoUrl ?? this.licensePhotoUrl,
      vehiclePhotoUrl: vehiclePhotoUrl ?? this.vehiclePhotoUrl,
      todaPhotoUrl: todaPhotoUrl ?? this.todaPhotoUrl,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN WIDGET
// ─────────────────────────────────────────────────────────────────────────────

class DriverHome extends StatefulWidget {
  const DriverHome({super.key});
  @override
  State<DriverHome> createState() => _DriverHomeState();
}

class _DriverHomeState extends State<DriverHome>
    with SingleTickerProviderStateMixin {
  // ── Theme ─────────────────────────────────────────────────────────────────
  final ThemeProvider _themeProvider = ThemeProvider();

  AppThemeColors get _t => _themeProvider.colors;
  Color _o(Color c, double alpha) => c.withValues(alpha: alpha);

  bool _isOnline = false;
  List _earnings = [];
  Map? _summary;
  bool _loading = false;
  int _tab = 0;

  final MapController _mapController = MapController();
  LatLng _driverLocation = const LatLng(14.5995, 120.9842);
  List<LatLng> _routePoints = [];
  RideRequest? _activeRide;
  RideRequest? _pendingRequest;
  bool _routeLoading = false;
  StreamSubscription<Position>? _locationSub;

  double? _gpsAccuracy;
  double? _gpsSpeed;
  double? _gpsHeading;

  LatLng? _commuterLiveLocation;

  DriverProfile? _driverProfile;
  bool _profileLoading = false;

  FareConfig _fareConfig = FareConfig.defaults();
  bool _fareConfigLoading = false;
  Timer? _fareConfigRefreshTimer;

  Timer? _ridePollingTimer;
  Timer? _locationPushTimer;
  Timer? _profileRefreshTimer;

  late AnimationController _animController;
  late Animation<double> _fadeAnim;

  // ── Notification service ──────────────────────────────────────────────────
  final NotificationService _notif = NotificationService();

  // ── Responsive helpers ────────────────────────────────────────────────────
  bool get _isSmallScreen => MediaQuery.of(context).size.width < 400;
  double get _screenHeight => MediaQuery.of(context).size.height;
  double get _screenWidth => MediaQuery.of(context).size.width;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 600));
    _fadeAnim = CurvedAnimation(parent: _animController, curve: Curves.easeOut);
    _animController.forward();
    _loadEarnings();
    _loadDriverProfile();
    _loadFareConfig();
    _initGPS();
    _profileRefreshTimer = Timer.periodic(
        const Duration(seconds: 30), (_) => _loadDriverProfile());
    _fareConfigRefreshTimer =
        Timer.periodic(const Duration(seconds: 60), (_) => _loadFareConfig());
  }

  @override
  void dispose() {
    _animController.dispose();
    _locationSub?.cancel();
    _ridePollingTimer?.cancel();
    _locationPushTimer?.cancel();
    _profileRefreshTimer?.cancel();
    _fareConfigRefreshTimer?.cancel();
    super.dispose();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FARE CONFIG
  // ─────────────────────────────────────────────────────────────────────────

  Future<void> _loadFareConfig() async {
    if (_fareConfigLoading) return;
    setState(() => _fareConfigLoading = true);
    try {
      final dio = ApiClient.build(ApiConstants.djangoBase);
      final res = await dio.get('/api/fare-config');
      final data = res.data;
      if (data != null && data is Map<String, dynamic> && mounted) {
        final oldSurge = _fareConfig.surgeEnabled;
        final newConfig = FareConfig.fromJson(data);
        if (!oldSurge && newConfig.surgeEnabled) {
          _notif.add(AppNotification(
            type: NotifType.info,
            title: 'Surge Pricing Active 🔥',
            body:
                'Surge ×${newConfig.surgeMultiplier.toStringAsFixed(1)} is now active. Earn more per ride!',
          ));
        }
        setState(() => _fareConfig = newConfig);
      }
    } catch (_) {}
    if (mounted) setState(() => _fareConfigLoading = false);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GPS
  // ─────────────────────────────────────────────────────────────────────────

  Future<void> _initGPS() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      _notif.add(AppNotification(
        type: NotifType.gpsLost,
        title: 'GPS Disabled',
        body: 'Please enable location services to go online.',
      ));
      return;
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) return;
    }
    if (permission == LocationPermission.deniedForever) return;

    try {
      final pos = await Geolocator.getCurrentPosition(
        locationSettings:
            const LocationSettings(accuracy: LocationAccuracy.high),
      );
      if (mounted) {
        setState(() {
          _driverLocation = LatLng(pos.latitude, pos.longitude);
          _gpsAccuracy = pos.accuracy;
          _gpsSpeed = pos.speed;
          _gpsHeading = pos.heading;
        });
        _mapController.move(_driverLocation, 15);
      }
    } catch (_) {}

    _locationSub = Geolocator.getPositionStream(
      locationSettings: AndroidSettings(
        accuracy: LocationAccuracy.bestForNavigation,
        distanceFilter: 3,
        intervalDuration: const Duration(seconds: 2),
        foregroundNotificationConfig: const ForegroundNotificationConfig(
          notificationText: 'PasadaNow Driver — GPS active',
          notificationTitle: 'Location Active',
          enableWakeLock: true,
        ),
      ),
    ).listen((Position pos) {
      if (!mounted) return;
      setState(() {
        _driverLocation = LatLng(pos.latitude, pos.longitude);
        _gpsAccuracy = pos.accuracy;
        _gpsSpeed = pos.speed;
        _gpsHeading = pos.heading;
      });
      if (_activeRide == null) {
        _mapController.move(_driverLocation, _mapController.camera.zoom);
      }
    }, onError: (_) {
      _notif.add(AppNotification(
        type: NotifType.gpsLost,
        title: 'GPS Signal Lost',
        body: 'Location tracking interrupted. Tap to retry.',
      ));
    });
  }

  Future<void> _toggleOnline() async {
    final next = !_isOnline;
    setState(() => _isOnline = next);

    if (next) {
      _startRidePolling();
      _startLocationPush();
      _notif.add(AppNotification.driverOnline());
    } else {
      _ridePollingTimer?.cancel();
      _locationPushTimer?.cancel();
      _notif.add(AppNotification.driverOffline());
      setState(() {
        _activeRide = null;
        _pendingRequest = null;
        _routePoints = [];
        _commuterLiveLocation = null;
      });
    }

    try {
      final dio = ApiClient.build(ApiConstants.djangoBase);
      await dio.patch('/api/drivers/me/status', data: {
        'is_online': next,
        'lat': _driverLocation.latitude,
        'lng': _driverLocation.longitude,
      });
    } catch (_) {}
  }

  void _startLocationPush() {
    _locationPushTimer?.cancel();
    _locationPushTimer =
        Timer.periodic(const Duration(seconds: 2), (_) => _pushLocation());
    _pushLocation();
  }

  Future<void> _pushLocation() async {
    if (!_isOnline) return;
    try {
      final dio = ApiClient.build(ApiConstants.djangoBase);
      await dio.patch('/api/drivers/me/location', data: {
        'lat': _driverLocation.latitude,
        'lng': _driverLocation.longitude,
      });

      if (_activeRide != null) {
        final djangoDio = ApiClient.build(ApiConstants.djangoBase);
        await djangoDio.post(
          '/api/drivers/rides/${_activeRide!.id}/driver-location',
          data: {
            'lat': _driverLocation.latitude,
            'lng': _driverLocation.longitude,
            'accuracy': _gpsAccuracy,
            'speed': _gpsSpeed,
            'heading': _gpsHeading,
          },
        );
      }
    } catch (_) {}
  }

  Future<void> _loadDriverProfile() async {
    if (_profileLoading) return;
    setState(() => _profileLoading = true);
    try {
      final dio = ApiClient.build(ApiConstants.djangoBase);
      final res = await dio.get('/api/drivers/me/profile');
      final data = res.data as Map<String, dynamic>;
      if (mounted) {
        setState(() {
          _driverProfile = DriverProfile.fromJson(data);
        });
      }
    } catch (_) {}
    if (mounted) setState(() => _profileLoading = false);
  }

  Future<bool> _updateProfile(Map<String, dynamic> updates) async {
    try {
      final dio = ApiClient.build(ApiConstants.djangoBase);
      await dio.patch('/api/drivers/me/profile', data: updates);
      await _loadDriverProfile();
      _notif.add(AppNotification(
        type: NotifType.info,
        title: 'Profile Updated',
        body: 'Your profile changes have been saved.',
      ));
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<void> _pickAndUploadProfilePhoto() async {
    final picker = ImagePicker();
    final XFile? picked = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
      maxWidth: 800,
    );
    if (picked == null) return;
    final bytes = await picked.readAsBytes();
    final base64Str = base64Encode(bytes);
    final success = await _updateProfile({'profilePhoto': base64Str});
    if (mounted) {
      _showSnack(
        success ? 'Profile photo updated!' : 'Failed to update photo.',
        success ? _t.green : _t.red,
      );
    }
  }

  Future<void> _fetchRoute(LatLng from, LatLng to) async {
    if ((from.latitude == 0 && from.longitude == 0) ||
        (to.latitude == 0 && to.longitude == 0)) {
      return;
    }

    setState(() => _routeLoading = true);
    try {
      final url = Uri.parse(
        'https://router.project-osrm.org/route/v1/driving/'
        '${from.longitude},${from.latitude};'
        '${to.longitude},${to.latitude}'
        '?overview=full&geometries=geojson',
      );
      final res = await http.get(url);
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final coords = data['routes'][0]['geometry']['coordinates'] as List;
        setState(() {
          _routePoints = coords
              .map<LatLng>((c) =>
                  LatLng((c[1] as num).toDouble(), (c[0] as num).toDouble()))
              .toList();
        });
        if (_routePoints.isNotEmpty) {
          final bounds = LatLngBounds.fromPoints(_routePoints);
          _mapController.fitCamera(CameraFit.bounds(
              bounds: bounds, padding: const EdgeInsets.all(56)));
        }
      }
    } catch (_) {
      setState(() => _routePoints = [from, to]);
    } finally {
      setState(() => _routeLoading = false);
    }
  }

  void _startRidePolling() {
    _ridePollingTimer?.cancel();
    _ridePollingTimer =
        Timer.periodic(const Duration(seconds: 3), (_) => _pollPendingRide());
    _pollPendingRide();
  }

  Future<void> _pollPendingRide() async {
    if (!_isOnline || _activeRide != null || _pendingRequest != null) return;
    try {
      final dio = ApiClient.build(ApiConstants.djangoBase);
      final res = await dio.get('/api/drivers/rides/pending');
      final data = res.data;
      if (data != null && data is Map && data.isNotEmpty) {
        debugPrint('PENDING RIDE PAYLOAD: $data');
        final req = RideRequest.fromJson(data as Map<String, dynamic>);
        if (mounted && _pendingRequest == null && _activeRide == null) {
          setState(() => _pendingRequest = req);
          _notif.add(AppNotification.newRideRequest(
            req.passengerName,
            req.pickupLabel.isNotEmpty ? req.pickupLabel : 'Unknown pickup',
            _fareConfig.computeFareString(req.distanceKm),
          ));
          _showRideRequestSheet(req);
        }
      }
    } catch (_) {}
  }

  void _startCommuterLocationPoll() {
    Timer.periodic(const Duration(seconds: 3), (t) async {
      if (_activeRide == null) {
        t.cancel();
        return;
      }
      try {
        final dio = ApiClient.build(ApiConstants.djangoBase);
        final res = await dio
            .get('/api/drivers/rides/${_activeRide!.id}/commuter-location');
        final data = res.data as Map<String, dynamic>?;
        if (data != null &&
            data['lat'] != null &&
            data['lng'] != null &&
            mounted) {
          setState(() {
            _commuterLiveLocation = LatLng(
              (data['lat'] as num).toDouble(),
              (data['lng'] as num).toDouble(),
            );
          });
        }
      } catch (_) {}
    });
  }

  Future<void> _acceptRide(RideRequest req) async {
    Navigator.of(context).pop();
    setState(() {
      _activeRide = req;
      _pendingRequest = null;
    });

    if (req.hasValidPickup && req.hasValidDropoff) {
      await _fetchRoute(_driverLocation, req.pickup);
    } else {
      if (mounted) {
        _showSnack('Warning: ride has missing location data.', _t.orange);
      }
    }

    _notif.add(AppNotification(
      type: NotifType.rideAccepted,
      title: 'Ride Accepted',
      body:
          'You accepted ${req.passengerName}\'s ride. Navigate to pickup point.',
    ));

    if (mounted) {
      _showSnack('Ride accepted! Navigate to pickup point.', _t.green);
    }
    _startCommuterLocationPoll();

    try {
      final dio = ApiClient.build(ApiConstants.djangoBase);
      await dio.patch('/api/drivers/rides/${req.id}/accept', data: {
        'driver_lat': _driverLocation.latitude,
        'driver_lng': _driverLocation.longitude,
      });
    } catch (_) {}
  }

  Future<void> _completeRide() async {
    setState(() => _loading = true);
    final earned = _activeRide!.fare;
    final rideId = _activeRide!.id;
    final passengerName = _activeRide!.passengerName;
    try {
      final dio = ApiClient.build(ApiConstants.djangoBase);
      await dio.patch('/api/drivers/rides/$rideId/complete', data: {
        'driver_lat': _driverLocation.latitude,
        'driver_lng': _driverLocation.longitude,
      });
      await _loadEarnings();

      _notif.add(AppNotification.rideEarned('₱${earned.toStringAsFixed(2)}'));
      _notif.add(AppNotification(
        type: NotifType.rideCompleted,
        title: 'Ride Completed',
        body:
            'You completed $passengerName\'s ride and earned ₱${earned.toStringAsFixed(2)}.',
      ));
    } catch (_) {
    } finally {
      if (mounted) {
        _showSnack(
            'Ride completed! ₱${earned.toStringAsFixed(2)} earned.', _t.green);
        setState(() {
          _loading = false;
          _activeRide = null;
          _routePoints = [];
          _commuterLiveLocation = null;
        });
      }
    }
  }

  Future<void> _loadEarnings() async {
    try {
      final dio = ApiClient.build(ApiConstants.djangoBase);
      final list = await dio.get('/api/earnings/list');
      final summary = await dio.get('/api/earnings/summary');
      if (mounted) {
        setState(() {
          _earnings = list.data;
          _summary = summary.data;
        });
      }
    } catch (_) {}
  }

  void _showSnack(String msg, Color color) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg, style: const TextStyle(fontSize: 13)),
      backgroundColor: color,
      behavior: SnackBarBehavior.floating,
      margin: EdgeInsets.only(
        bottom: MediaQuery.of(context).padding.bottom + 80,
        left: 16,
        right: 16,
      ),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    ));
  }

  void _showRideRequestSheet(RideRequest req) {
    showModalBottomSheet(
      context: context,
      isDismissible: false,
      enableDrag: false,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => _RideRequestSheet(
        req: req,
        fareConfig: _fareConfig,
        themeColors: _t,
        onAccept: () => _acceptRide(req),
        onDecline: () {
          Navigator.of(context).pop();
          setState(() => _pendingRequest = null);
          _notif.add(AppNotification(
            type: NotifType.rideDeclined,
            title: 'Ride Declined',
            body: 'You declined ${req.passengerName}\'s ride request.',
          ));
          _declineRideOnBackend(req.id);
        },
      ),
    );
  }

  Future<void> _declineRideOnBackend(int rideId) async {
    try {
      final dio = ApiClient.build(ApiConstants.djangoBase);
      await dio.patch('/api/drivers/rides/$rideId/decline');
    } catch (_) {}
  }

  String get _gpsAccuracyLabel {
    if (_gpsAccuracy == null) return '—';
    if (_gpsAccuracy! < 5) return 'Excellent';
    if (_gpsAccuracy! < 15) return 'Good';
    if (_gpsAccuracy! < 40) return 'Fair';
    return 'Poor';
  }

  Color get _gpsAccuracyColor {
    if (_gpsAccuracy == null) return _t.textMuted;
    if (_gpsAccuracy! < 5) return _t.green;
    if (_gpsAccuracy! < 15) return _t.green;
    if (_gpsAccuracy! < 40) return _t.orange;
    return _t.red;
  }

  String get _gpsSpeedLabel {
    if (_gpsSpeed == null || _gpsSpeed! < 0.5) return '0 km/h';
    return '${(_gpsSpeed! * 3.6).toStringAsFixed(1)} km/h';
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CHANGE PASSWORD
  // ─────────────────────────────────────────────────────────────────────────

  void _showChangePasswordDialog() {
    final currentCtrl = TextEditingController();
    final newCtrl = TextEditingController();
    final confirmCtrl = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Padding(
          padding:
              EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
          child: SingleChildScrollView(
            child: Container(
              margin: const EdgeInsets.fromLTRB(12, 12, 12, 20),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: _t.appBarBg,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: _t.border, width: 1.5),
              ),
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                Row(children: [
                  Icon(Icons.lock_outline_rounded, color: _t.accent, size: 18),
                  const SizedBox(width: 8),
                  Text('Change Password',
                      style: TextStyle(
                          color: _t.textPrimary,
                          fontSize: 16,
                          fontWeight: FontWeight.w800)),
                  const Spacer(),
                  GestureDetector(
                      onTap: () => Navigator.pop(ctx),
                      child: Icon(Icons.close, color: _t.textMuted, size: 20)),
                ]),
                const SizedBox(height: 20),
                _pwdField(currentCtrl, 'Current Password'),
                const SizedBox(height: 12),
                _pwdField(newCtrl, 'New Password'),
                const SizedBox(height: 12),
                _pwdField(confirmCtrl, 'Confirm New Password'),
                const SizedBox(height: 20),
                StatefulBuilder(builder: (ctx2, setSt) {
                  bool saving = false;
                  return GestureDetector(
                    onTap: saving
                        ? null
                        : () async {
                            if (newCtrl.text != confirmCtrl.text) {
                              _showSnack('Passwords do not match.', _t.red);
                              return;
                            }
                            if (newCtrl.text.length < 6) {
                              _showSnack(
                                  'Password must be at least 6 characters.',
                                  _t.red);
                              return;
                            }
                            setSt(() => saving = true);
                            bool ok = false;
                            try {
                              final dio =
                                  ApiClient.build(ApiConstants.djangoBase);
                              await dio.post(
                                '/api/drivers/me/change-password',
                                data: {
                                  'current_password': currentCtrl.text,
                                  'new_password': newCtrl.text,
                                },
                              );
                              ok = true;
                            } catch (_) {}
                            if (ctx2.mounted) Navigator.pop(ctx2);
                            _showSnack(
                                ok
                                    ? 'Password changed!'
                                    : 'Failed to change password.',
                                ok ? _t.green : _t.red);
                          },
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      decoration: BoxDecoration(
                        color: saving ? _o(_t.accent, 0.5) : _t.accent,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: saving
                            ? null
                            : [
                                BoxShadow(
                                    color: _o(_t.accent, 0.4),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4))
                              ],
                      ),
                      child: saving
                          ? const Center(
                              child: SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                    color: Colors.white, strokeWidth: 2),
                              ),
                            )
                          : const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                  Icon(Icons.save_outlined,
                                      color: Colors.white, size: 18),
                                  SizedBox(width: 8),
                                  Text('Update Password',
                                      style: TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.w800,
                                          fontSize: 15)),
                                ]),
                    ),
                  );
                }),
              ]),
            ),
          ),
        );
      },
    ).whenComplete(() {
      currentCtrl.dispose();
      newCtrl.dispose();
      confirmCtrl.dispose();
    });
  }

  Widget _pwdField(TextEditingController ctrl, String hint) {
    return Container(
      decoration: BoxDecoration(
        color: _t.bgDeep,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: _t.border),
      ),
      child: TextField(
        controller: ctrl,
        obscureText: true,
        style: TextStyle(color: _t.textPrimary, fontSize: 13),
        cursorColor: _t.accent,
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(color: _o(_t.textMuted, 0.6), fontSize: 13),
          prefixIcon:
              Icon(Icons.lock_outline_rounded, color: _t.textMuted, size: 16),
          border: InputBorder.none,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BUILD
  // ─────────────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final auth = context.read<AuthProvider>();
    return AnimatedBuilder(
      animation: _themeProvider,
      builder: (context, _) {
        return Scaffold(
          backgroundColor: _t.bgDeep,
          appBar: _buildAppBar(auth),
          bottomNavigationBar: _buildBottomNav(),
          body: FadeTransition(
            opacity: _fadeAnim,
            child: _tab == 0
                ? _buildDashboardTab(auth)
                : _tab == 1
                    ? _buildEarningsTab()
                    : _buildProfileTab(auth),
          ),
        );
      },
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // APP BAR
  // ─────────────────────────────────────────────────────────────────────────

  PreferredSizeWidget _buildAppBar(AuthProvider auth) {
    final profile = _driverProfile;
    final displayName = profile?.fullName.isNotEmpty == true
        ? profile!.fullName.split(' ').first
        : auth.username ?? 'Driver';

    final hour = DateTime.now().hour;
    final greeting = hour < 12
        ? 'Good morning'
        : hour < 17
            ? 'Good afternoon'
            : 'Good evening';

    return AppBar(
      backgroundColor: _t.appBarBg,
      elevation: 0,
      titleSpacing: 12,
      automaticallyImplyLeading: false,
      title: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: _o(_t.accent, 0.15),
              border: Border.all(color: _o(_t.accent, 0.3), width: 1.5),
            ),
            clipBehavior: Clip.antiAlias,
            child: Image.asset(
              'assets/logo.png',
              fit: BoxFit.contain,
              errorBuilder: (_, __, ___) => Icon(
                Icons.directions_car_outlined,
                color: _t.accent,
                size: 20,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  RichText(
                    text: TextSpan(
                      style: const TextStyle(
                          fontSize: 16, fontWeight: FontWeight.w900),
                      children: [
                        TextSpan(
                            text: 'Pasada',
                            style: TextStyle(color: _t.textPrimary)),
                        TextSpan(
                            text: 'Now', style: TextStyle(color: _t.orange)),
                      ],
                    ),
                  ),
                  const SizedBox(width: 5),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                    decoration: BoxDecoration(
                      color: _o(_t.accent, 0.18),
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(color: _o(_t.accent, 0.35), width: 1),
                    ),
                    child: Text(
                      'DRIVER',
                      style: TextStyle(
                          fontSize: 8,
                          color: _t.accent,
                          letterSpacing: 1.0,
                          fontWeight: FontWeight.w700),
                    ),
                  ),
                ],
              ),
              Text(
                '$greeting, $displayName 👋',
                style: TextStyle(
                    fontSize: 10,
                    color: _t.textMuted,
                    fontWeight: FontWeight.w500,
                    height: 1.2),
              ),
            ],
          ),
        ],
      ),
      actions: [
        GestureDetector(
          onTap: _initGPS,
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 3),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
              decoration: BoxDecoration(
                color: _o(_gpsAccuracy != null ? _t.green : _t.orange, 0.15),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                    color:
                        _o(_gpsAccuracy != null ? _t.green : _t.orange, 0.45),
                    width: 1),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _gpsAccuracy != null
                      ? _PulsingDot(color: _t.green)
                      : Container(
                          width: 6,
                          height: 6,
                          decoration: BoxDecoration(
                              color: _t.orange, shape: BoxShape.circle)),
                  const SizedBox(width: 4),
                  Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        _gpsAccuracy != null ? 'LIVE' : 'GPS',
                        style: TextStyle(
                            color: _gpsAccuracy != null ? _t.green : _t.orange,
                            fontSize: 8,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.5),
                      ),
                      if (_gpsAccuracy != null)
                        Text(
                          '±${_gpsAccuracy!.toStringAsFixed(0)}m',
                          style: TextStyle(
                              color: _gpsAccuracyColor,
                              fontSize: 7,
                              fontWeight: FontWeight.w600),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
        GestureDetector(
          onTap: _loadFareConfig,
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 3),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
              decoration: BoxDecoration(
                color:
                    _o(_fareConfig.surgeEnabled ? _t.orange : _t.accent, 0.15),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                    color: _o(
                        _fareConfig.surgeEnabled ? _t.orange : _t.accent, 0.45),
                    width: 1),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '₱${_fareConfig.baseFare.toStringAsFixed(0)}+',
                    style: TextStyle(
                        color: _fareConfig.surgeEnabled ? _t.orange : _t.accent,
                        fontSize: 9,
                        fontWeight: FontWeight.w800),
                  ),
                  Text(
                    '${_fareConfig.perKmRate.toStringAsFixed(0)}/km',
                    style: TextStyle(
                        color:
                            _fareConfig.surgeEnabled ? _t.orange : _t.textMuted,
                        fontSize: 7,
                        fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 2),
          child: NotificationBell(
            service: _notif,
            iconColor: _t.textPrimary,
            badgeColor: _t.accent,
          ),
        ),
        GestureDetector(
          onTap: () {
            setState(() => _themeProvider.toggle());
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 3),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              width: 42,
              height: 24,
              padding: const EdgeInsets.all(2),
              decoration: BoxDecoration(
                color: _themeProvider.isDark
                    ? _o(_t.accent, 0.25)
                    : _o(_t.orange, 0.2),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: _themeProvider.isDark
                      ? _o(_t.accent, 0.5)
                      : _o(_t.orange, 0.5),
                  width: 1,
                ),
              ),
              child: Stack(
                children: [
                  AnimatedAlign(
                    duration: const Duration(milliseconds: 250),
                    curve: Curves.easeInOut,
                    alignment: _themeProvider.isDark
                        ? Alignment.centerLeft
                        : Alignment.centerRight,
                    child: Container(
                      width: 18,
                      height: 18,
                      decoration: BoxDecoration(
                        color: _themeProvider.isDark ? _t.accent : _t.orange,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        _themeProvider.isDark
                            ? Icons.dark_mode_rounded
                            : Icons.light_mode_rounded,
                        color: Colors.white,
                        size: 11,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        GestureDetector(
          onTap: () => setState(() => _tab = 2),
          child: Padding(
            padding: const EdgeInsets.only(right: 10, left: 2),
            child: _buildAvatarWidget(radius: 15, fontSize: 12),
          ),
        ),
      ],
    );
  }

  Widget _buildBottomNav() {
    return Container(
      decoration: BoxDecoration(
        color: _t.appBarBg,
        border: Border(top: BorderSide(color: _t.border, width: 1)),
      ),
      child: SafeArea(
        top: false,
        child: BottomNavigationBar(
          currentIndex: _tab,
          onTap: (i) {
            setState(() => _tab = i);
            if (i == 1) _loadEarnings();
            if (i == 2) _loadDriverProfile();
          },
          backgroundColor: Colors.transparent,
          selectedItemColor: _t.accent,
          unselectedItemColor: _t.textMuted,
          elevation: 0,
          selectedLabelStyle:
              const TextStyle(fontSize: 10, fontWeight: FontWeight.w600),
          unselectedLabelStyle: const TextStyle(fontSize: 10),
          items: const [
            BottomNavigationBarItem(
                icon: Icon(Icons.map_outlined, size: 22),
                activeIcon: Icon(Icons.map, size: 22),
                label: 'Dashboard'),
            BottomNavigationBarItem(
                icon: Icon(Icons.account_balance_wallet_outlined, size: 22),
                activeIcon: Icon(Icons.account_balance_wallet, size: 22),
                label: 'Earnings'),
            BottomNavigationBarItem(
                icon: Icon(Icons.person_outline, size: 22),
                activeIcon: Icon(Icons.person, size: 22),
                label: 'My Profile'),
          ],
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DASHBOARD TAB
  // ─────────────────────────────────────────────────────────────────────────

  Widget _buildDashboardTab(AuthProvider auth) {
    return Column(children: [
      Container(
        color: _t.appBarBg,
        padding: const EdgeInsets.fromLTRB(10, 8, 10, 8),
        child: Column(children: [
          _buildStatCards(),
          const SizedBox(height: 8),
          _buildStatusBanner(),
        ]),
      ),
      Expanded(child: _buildRealtimeMap()),
      if (_activeRide != null)
        ConstrainedBox(
          constraints: BoxConstraints(
            maxHeight: _screenHeight * 0.48,
          ),
          child: _buildActiveRideBanner(auth),
        ),
    ]);
  }

  Widget _buildRealtimeMap() {
    return Stack(children: [
      FlutterMap(
        mapController: _mapController,
        options: MapOptions(
          initialCenter: _driverLocation,
          initialZoom: 15.0,
          interactionOptions: const InteractionOptions(
            flags: InteractiveFlag.all,
          ),
        ),
        children: [
          TileLayer(
            urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            userAgentPackageName: 'com.pasadanow.driver',
            maxZoom: 19,
          ),
          if (_gpsAccuracy != null)
            CircleLayer(circles: [
              CircleMarker(
                point: _driverLocation,
                radius: _gpsAccuracy!,
                useRadiusInMeter: true,
                color: _o(_t.green, 0.07),
                borderColor: _o(_t.green, 0.2),
                borderStrokeWidth: 1.0,
              ),
            ]),
          if (_routePoints.isNotEmpty)
            PolylineLayer(polylines: [
              Polyline(
                points: _routePoints,
                color: _t.accent,
                strokeWidth: 4.0,
                borderColor: _o(_t.accent, 0.3),
                borderStrokeWidth: 8.0,
              ),
            ]),
          MarkerLayer(markers: [
            Marker(
              point: _driverLocation,
              width: 44,
              height: 44,
              child: _DriverMarker(
                  isOnline: _isOnline,
                  onlineColor: _t.green,
                  offlineColor: _t.textMuted),
            ),
            if (_commuterLiveLocation != null && _activeRide != null)
              Marker(
                point: _commuterLiveLocation!,
                width: 110,
                height: 52,
                alignment: Alignment.topCenter,
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(6),
                      boxShadow: const [
                        BoxShadow(color: Colors.black26, blurRadius: 4)
                      ],
                    ),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      _PulsingDot(color: _t.accent),
                      const SizedBox(width: 4),
                      Text(
                        _activeRide!.passengerName.split(' ').first,
                        style: const TextStyle(
                            color: Colors.black87,
                            fontSize: 9,
                            fontWeight: FontWeight.w700),
                      ),
                    ]),
                  ),
                  const SizedBox(height: 2),
                  Icon(Icons.person_pin_circle, color: _t.accent, size: 22),
                ]),
              ),
            if (_activeRide != null && _activeRide!.hasValidPickup)
              Marker(
                point: _activeRide!.pickup,
                width: 100,
                height: 52,
                alignment: Alignment.topCenter,
                child: _RouteMarker(
                    color: _t.green,
                    icon: Icons.radio_button_checked,
                    label: 'Pick up'),
              ),
            if (_activeRide != null && _activeRide!.hasValidDropoff)
              Marker(
                point: _activeRide!.dropoff,
                width: 110,
                height: 52,
                alignment: Alignment.topCenter,
                child: _RouteMarker(
                    color: _t.red, icon: Icons.location_on, label: 'Drop off'),
              ),
          ]),
          const RichAttributionWidget(attributions: [
            TextSourceAttribution('OpenStreetMap contributors'),
          ]),
        ],
      ),
      if (_routeLoading)
        Container(
          color: Colors.black38,
          child: Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
              decoration: BoxDecoration(
                color: _t.bgCard,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: _t.border),
              ),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: _t.accent),
                ),
                const SizedBox(width: 10),
                Text('Calculating route…',
                    style: TextStyle(color: _t.textPrimary, fontSize: 12)),
              ]),
            ),
          ),
        ),
      Positioned(
        top: 10,
        right: 10,
        child: Column(children: [
          _mapBtn(
              Icons.add,
              () => _mapController.move(_mapController.camera.center,
                  _mapController.camera.zoom + 1)),
          const SizedBox(height: 4),
          _mapBtn(
              Icons.remove,
              () => _mapController.move(_mapController.camera.center,
                  _mapController.camera.zoom - 1)),
          const SizedBox(height: 4),
          _mapBtn(Icons.my_location,
              () => _mapController.move(_driverLocation, 15)),
          if (_commuterLiveLocation != null) ...[
            const SizedBox(height: 4),
            _mapBtn(Icons.fit_screen, () {
              final bounds = LatLngBounds.fromPoints(
                  [_driverLocation, _commuterLiveLocation!]);
              _mapController.fitCamera(CameraFit.bounds(
                  bounds: bounds, padding: const EdgeInsets.all(60)));
            }),
          ],
        ]),
      ),
      if (_gpsAccuracy != null)
        Positioned(
          top: 10,
          left: 10,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 4),
            decoration: BoxDecoration(
              color: _o(_t.mapOverlayBg, 0.9),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: _t.border),
            ),
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(mainAxisSize: MainAxisSize.min, children: [
                _PulsingDot(color: _t.green),
                const SizedBox(width: 4),
                Text('GPS LIVE',
                    style: TextStyle(
                        color: _t.green,
                        fontSize: 7,
                        fontWeight: FontWeight.w700)),
              ]),
              Text('±${_gpsAccuracy!.toStringAsFixed(0)}m · $_gpsAccuracyLabel',
                  style: TextStyle(color: _gpsAccuracyColor, fontSize: 7)),
              Text(_gpsSpeedLabel,
                  style: TextStyle(
                      color: _t.textPrimary,
                      fontSize: 9,
                      fontWeight: FontWeight.w700)),
            ]),
          ),
        ),
      if (!_isOnline)
        Positioned.fill(
          child: IgnorePointer(
            child: Container(
              color: _o(Colors.black, 0.45),
              child: Center(
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                  decoration: BoxDecoration(
                    color: _t.bgCard,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: _t.border),
                  ),
                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                    Icon(Icons.signal_wifi_off_outlined,
                        color: _t.textMuted, size: 32),
                    const SizedBox(height: 8),
                    Text(
                      'Go online to start\naccepting rides',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                          color: _t.textMuted, fontSize: 12, height: 1.5),
                    ),
                  ]),
                ),
              ),
            ),
          ),
        ),
      Positioned(
        right: 6,
        bottom: 4,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.75),
            borderRadius: BorderRadius.circular(3),
          ),
          child: const Text('© OpenStreetMap',
              style: TextStyle(fontSize: 7, color: Colors.black54)),
        ),
      ),
    ]);
  }

  Widget _mapBtn(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 34,
        height: 34,
        decoration: BoxDecoration(
          color: _t.bgCard,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: _t.border),
          boxShadow: [BoxShadow(color: _o(Colors.black, 0.3), blurRadius: 6)],
        ),
        child: Center(child: Icon(icon, color: _t.textPrimary, size: 16)),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ACTIVE RIDE BANNER
  // ─────────────────────────────────────────────────────────────────────────

  Widget _buildActiveRideBanner(AuthProvider auth) {
    final ride = _activeRide!;
    return Container(
      decoration: BoxDecoration(
        color: _t.appBarBg,
        border: Border(top: BorderSide(color: _t.border, width: 1)),
        boxShadow: [
          BoxShadow(
              color: _o(Colors.black, 0.4),
              blurRadius: 12,
              offset: const Offset(0, -4)),
        ],
      ),
      child: SingleChildScrollView(
        physics: const ClampingScrollPhysics(),
        padding: EdgeInsets.fromLTRB(
          12,
          10,
          12,
          MediaQuery.of(context).padding.bottom + 10,
        ),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Row(children: [
            _statusBadge(Icons.radio_button_checked, 'Active Ride', _t.green),
            const Spacer(),
            _fareBadge(ride.fare),
          ]),
          const SizedBox(height: 10),
          Row(children: [
            CircleAvatar(
              radius: 16,
              backgroundColor: _o(_t.accent, 0.2),
              child: Text(ride.passengerName[0],
                  style: TextStyle(
                      color: _t.accent,
                      fontWeight: FontWeight.w800,
                      fontSize: 13)),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(ride.passengerName,
                        style: TextStyle(
                            color: _t.textPrimary,
                            fontWeight: FontWeight.w700,
                            fontSize: 13),
                        overflow: TextOverflow.ellipsis),
                    Row(children: [
                      Text(
                        '${ride.distanceKm.toStringAsFixed(1)} km · ₱${ride.fare.toStringAsFixed(2)}',
                        style: TextStyle(color: _t.textMuted, fontSize: 11),
                      ),
                      if (_commuterLiveLocation != null) ...[
                        const SizedBox(width: 5),
                        _PulsingDot(color: _t.accent),
                        const SizedBox(width: 3),
                        Text('Live',
                            style: TextStyle(color: _t.accent, fontSize: 10)),
                      ],
                    ]),
                  ]),
            ),
          ]),
          const SizedBox(height: 8),
          _routeLabel(
              Icons.radio_button_checked, _t.green, 'Pickup', ride.pickupLabel),
          const SizedBox(height: 4),
          _routeLabel(
              Icons.location_on_outlined, _t.red, 'Dropoff', ride.dropoffLabel),
          const SizedBox(height: 8),
          _fareBreakdownBanner(ride),
          const SizedBox(height: 10),
          SizedBox(
            height: 180,
            child: ChatWidget(
              rideId: ride.id.toString(),
              username: auth.username ?? 'driver',
              role: 'driver',
            ),
          ),
          const SizedBox(height: 10),
          Row(children: [
            if (_commuterLiveLocation != null) ...[
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                margin: const EdgeInsets.only(right: 8),
                decoration: BoxDecoration(
                  color: _o(_t.accent, 0.1),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: _o(_t.accent, 0.3)),
                ),
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  Text('Commuter',
                      style: TextStyle(color: _t.textMuted, fontSize: 9)),
                  _PulsingDot(color: _t.accent),
                  Text('Live', style: TextStyle(color: _t.accent, fontSize: 9)),
                ]),
              ),
            ],
            Expanded(
              child: GestureDetector(
                onTap: _loading ? null : _completeRide,
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 13),
                  decoration: BoxDecoration(
                    color: _t.green,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                          color: _o(_t.green, 0.4),
                          blurRadius: 10,
                          offset: const Offset(0, 4)),
                    ],
                  ),
                  child: _loading
                      ? const Center(
                          child: SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                  color: Colors.white, strokeWidth: 2)))
                      : const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.check_circle_outline,
                                color: Colors.white, size: 18),
                            SizedBox(width: 6),
                            Text('Complete Ride',
                                style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w800,
                                    fontSize: 14)),
                          ],
                        ),
                ),
              ),
            ),
          ]),
        ]),
      ),
    );
  }

  Widget _fareBreakdownBanner(RideRequest ride) {
    final cfg = _fareConfig;
    final multiplier = cfg.surgeEnabled ? cfg.surgeMultiplier : 1.0;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: _o(_t.orange, 0.08),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: _o(_t.orange, 0.25)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text('Base fare',
              style: TextStyle(color: _t.textMuted, fontSize: 11)),
          Text('₱${cfg.baseFare.toStringAsFixed(2)}',
              style: TextStyle(color: _t.textPrimary, fontSize: 11)),
        ]),
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Flexible(
            child: Text(
                'Distance (${ride.distanceKm.toStringAsFixed(1)} km × ₱${cfg.perKmRate.toStringAsFixed(2)})',
                style: TextStyle(color: _t.textMuted, fontSize: 11),
                overflow: TextOverflow.ellipsis),
          ),
          const SizedBox(width: 8),
          Text('₱${(ride.distanceKm * cfg.perKmRate).toStringAsFixed(2)}',
              style: TextStyle(color: _t.textPrimary, fontSize: 11)),
        ]),
        if (cfg.surgeEnabled)
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text('Surge (×${multiplier.toStringAsFixed(1)})',
                style: TextStyle(color: _t.orange, fontSize: 11)),
            Text('+${((multiplier - 1) * 100).toStringAsFixed(0)}%',
                style: TextStyle(color: _t.orange, fontSize: 11)),
          ]),
        if (cfg.bookingFee > 0)
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text('Booking fee',
                style: TextStyle(color: _t.textMuted, fontSize: 11)),
            Text('₱${cfg.bookingFee.toStringAsFixed(2)}',
                style: TextStyle(color: _t.textPrimary, fontSize: 11)),
          ]),
      ]),
    );
  }

  Widget _statusBadge(IconData icon, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: _o(color, 0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: _o(color, 0.3)),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, color: color, size: 11),
        const SizedBox(width: 4),
        Text(label,
            style: TextStyle(
                color: color, fontSize: 11, fontWeight: FontWeight.w700)),
      ]),
    );
  }

  Widget _fareBadge(double fare) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
      decoration: BoxDecoration(
        color: _o(_t.orange, 0.15),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: _o(_t.orange, 0.4)),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.credit_card_outlined, color: _t.orange, size: 14),
        const SizedBox(width: 4),
        Text('₱${fare.toStringAsFixed(2)}',
            style: TextStyle(
                color: _t.orange, fontWeight: FontWeight.w800, fontSize: 14)),
      ]),
    );
  }

  Widget _routeLabel(IconData icon, Color color, String heading, String sub) {
    return Row(children: [
      Icon(icon, color: color, size: 16),
      const SizedBox(width: 6),
      Expanded(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(heading,
              style: TextStyle(
                  color: color, fontSize: 9, fontWeight: FontWeight.w600)),
          Text(sub,
              style: TextStyle(color: _t.textPrimary, fontSize: 11),
              overflow: TextOverflow.ellipsis),
        ]),
      ),
    ]);
  }

  Widget _buildStatCards() {
    final todayEarnings = _summary?['today'] ?? 0.0;
    final allTime = _summary?['all_time'] ?? 0.0;
    final trips = _summary?['total_trips'] ?? 0;

    return Row(children: [
      Expanded(
          child: _statCard(
              icon: Icons.account_balance_wallet_outlined,
              iconColor: _t.green,
              iconBg: _o(_t.green, 0.12),
              label: 'TOTAL',
              value: '₱${(allTime as num).toStringAsFixed(2)}')),
      const SizedBox(width: 6),
      Expanded(
          child: _statCard(
              icon: Icons.directions_car_outlined,
              iconColor: _t.accent,
              iconBg: _o(_t.accent, 0.12),
              label: 'TRIPS',
              value: '$trips')),
      const SizedBox(width: 6),
      Expanded(
          child: _statCard(
              icon: Icons.bar_chart_outlined,
              iconColor: _t.orange,
              iconBg: _o(_t.orange, 0.12),
              label: 'TODAY',
              value: '₱${(todayEarnings as num).toStringAsFixed(2)}')),
      const SizedBox(width: 6),
      Expanded(
          child: _statCard(
              icon: _isOnline ? Icons.wifi_outlined : Icons.wifi_off_outlined,
              iconColor: _isOnline ? _t.green : _t.textMuted,
              iconBg: _o(_isOnline ? _t.green : _t.textMuted, 0.12),
              label: 'STATUS',
              value: _isOnline ? 'ON' : 'OFF',
              valueColor: _isOnline ? _t.green : _t.textMuted)),
    ]);
  }

  Widget _statCard({
    required IconData icon,
    required Color iconColor,
    required Color iconBg,
    required String label,
    required String value,
    Color? valueColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: _t.bgCard,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: _t.border, width: 1),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          width: 26,
          height: 26,
          decoration: BoxDecoration(
              color: iconBg, borderRadius: BorderRadius.circular(7)),
          child: Center(child: Icon(icon, color: iconColor, size: 14)),
        ),
        const SizedBox(height: 5),
        Text(value,
            style: TextStyle(
                color: valueColor ?? _t.textPrimary,
                fontSize: 13,
                fontWeight: FontWeight.w800)),
        Text(label,
            style: TextStyle(
                color: _t.textMuted, fontSize: 7, letterSpacing: 0.8)),
      ]),
    );
  }

  Widget _buildStatusBanner() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: _t.bgCard,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: _t.border, width: 1),
      ),
      child: Row(children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: _isOnline ? _t.green : _t.textMuted,
            boxShadow: _isOnline
                ? [
                    BoxShadow(
                        color: _o(_t.green, 0.5),
                        blurRadius: 8,
                        spreadRadius: 2)
                  ]
                : null,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            _isOnline
                ? _activeRide != null
                    ? 'On a ride — completing delivery'
                    : 'Online — Waiting for requests…'
                : 'Go online to start accepting rides',
            style: TextStyle(color: _t.textMuted, fontSize: 10),
            overflow: TextOverflow.ellipsis,
          ),
        ),
        const SizedBox(width: 8),
        GestureDetector(
          onTap: _activeRide == null ? _toggleOnline : null,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
            decoration: BoxDecoration(
              color: _activeRide != null
                  ? _o(_t.textMuted, 0.2)
                  : _isOnline
                      ? _t.red
                      : _t.green,
              borderRadius: BorderRadius.circular(8),
              boxShadow: _activeRide == null
                  ? [
                      BoxShadow(
                          color: _o(_isOnline ? _t.red : _t.green, 0.4),
                          blurRadius: 10,
                          offset: const Offset(0, 3)),
                    ]
                  : null,
            ),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              Icon(
                _activeRide != null
                    ? Icons.directions_car
                    : _isOnline
                        ? Icons.wifi_off
                        : Icons.wifi,
                color: Colors.white,
                size: 13,
              ),
              const SizedBox(width: 4),
              Text(
                _activeRide != null
                    ? 'On Ride'
                    : _isOnline
                        ? 'Go Offline'
                        : 'Go Online',
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.w700),
              ),
            ]),
          ),
        ),
      ]),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EARNINGS TAB
  // ─────────────────────────────────────────────────────────────────────────

  Widget _buildEarningsTab() {
    return RefreshIndicator(
      color: _t.accent,
      backgroundColor: _t.bgCard,
      onRefresh: _loadEarnings,
      child: ListView(
        padding: EdgeInsets.fromLTRB(
            14, 14, 14, MediaQuery.of(context).padding.bottom + 14),
        children: [
          Container(
            margin: const EdgeInsets.only(bottom: 14),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: _t.bgCard,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: _o(_t.accent, 0.3), width: 1),
            ),
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Icon(Icons.price_change_outlined, color: _t.accent, size: 15),
                const SizedBox(width: 6),
                Text('Current Fare Rates',
                    style: TextStyle(
                        color: _t.textPrimary,
                        fontSize: 13,
                        fontWeight: FontWeight.w700)),
                const Spacer(),
                if (_fareConfig.surgeEnabled)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: _o(_t.orange, 0.15),
                      borderRadius: BorderRadius.circular(5),
                      border: Border.all(color: _o(_t.orange, 0.4)),
                    ),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      Icon(Icons.bolt, color: _t.orange, size: 10),
                      const SizedBox(width: 2),
                      Text(
                          'SURGE ×${_fareConfig.surgeMultiplier.toStringAsFixed(1)}',
                          style: TextStyle(
                              color: _t.orange,
                              fontSize: 9,
                              fontWeight: FontWeight.w700)),
                    ]),
                  ),
              ]),
              const SizedBox(height: 10),
              _infoRow(Icons.flag_outlined, 'Base Fare',
                  '₱${_fareConfig.baseFare.toStringAsFixed(2)}'),
              _infoRow(Icons.straighten_outlined, 'Per-km Rate',
                  '₱${_fareConfig.perKmRate.toStringAsFixed(2)}/km'),
              _infoRow(Icons.arrow_downward_outlined, 'Minimum Fare',
                  '₱${_fareConfig.minimumFare.toStringAsFixed(2)}'),
              if (_fareConfig.bookingFee > 0)
                _infoRow(Icons.receipt_outlined, 'Booking Fee',
                    '₱${_fareConfig.bookingFee.toStringAsFixed(2)}'),
              Divider(color: _t.border, height: 14),
              Text(
                  'Formula: max(₱${_fareConfig.minimumFare.toStringAsFixed(0)}, '
                  '(₱${_fareConfig.baseFare.toStringAsFixed(0)} + ₱${_fareConfig.perKmRate.toStringAsFixed(0)}×km)'
                  '${_fareConfig.surgeEnabled ? ' ×${_fareConfig.surgeMultiplier.toStringAsFixed(1)}' : ''}'
                  '${_fareConfig.bookingFee > 0 ? ' + ₱${_fareConfig.bookingFee.toStringAsFixed(0)}' : ''})',
                  style: TextStyle(color: _t.textMuted, fontSize: 9)),
            ]),
          ),
          if (_summary != null) ...[
            Row(children: [
              Expanded(
                  child: _earningsStat(Icons.today_outlined, 'Today',
                      '₱${(_summary!['today'] as num).toStringAsFixed(2)}')),
              const SizedBox(width: 10),
              Expanded(
                  child: _earningsStat(Icons.emoji_events_outlined, 'All-time',
                      '₱${(_summary!['all_time'] as num).toStringAsFixed(2)}')),
            ]),
            const SizedBox(height: 14),
          ],
          Row(children: [
            Icon(Icons.receipt_long_outlined, color: _t.textPrimary, size: 16),
            const SizedBox(width: 7),
            Text('Earnings & History',
                style: TextStyle(
                    color: _t.textPrimary,
                    fontSize: 15,
                    fontWeight: FontWeight.w800)),
          ]),
          const SizedBox(height: 10),
          if (_earnings.isEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 40),
                child: Column(children: [
                  Icon(Icons.receipt_outlined, color: _t.textMuted, size: 48),
                  const SizedBox(height: 10),
                  Text('No earnings yet.',
                      style: TextStyle(color: _t.textMuted, fontSize: 14)),
                ]),
              ),
            )
          else
            ..._earnings.map((e) => Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: _t.bgCard,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: _t.border, width: 1),
                  ),
                  child: Row(children: [
                    Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: _o(_t.green, 0.12),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Center(
                        child: Icon(Icons.payments_outlined,
                            color: _t.green, size: 20),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('₱${e['amount']}',
                                style: TextStyle(
                                    color: _t.textPrimary,
                                    fontWeight: FontWeight.w700,
                                    fontSize: 14)),
                            Text('Ride #${e['ride']} · ${e['date']}',
                                style: TextStyle(
                                    color: _t.textMuted, fontSize: 11)),
                          ]),
                    ),
                    Icon(Icons.check_circle_outline, color: _t.green, size: 16),
                  ]),
                )),
        ],
      ),
    );
  }

  Widget _earningsStat(IconData icon, String label, String value) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: _t.bgCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _t.border, width: 1),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(icon, color: _t.textMuted, size: 13),
          const SizedBox(width: 4),
          Text(label, style: TextStyle(color: _t.textMuted, fontSize: 11)),
        ]),
        const SizedBox(height: 4),
        Text(value,
            style: TextStyle(
                color: _t.green, fontSize: 20, fontWeight: FontWeight.w800)),
      ]),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PROFILE TAB
  // ─────────────────────────────────────────────────────────────────────────

  Widget _buildProfileTab(AuthProvider auth) {
    final profile = _driverProfile;

    if (_profileLoading && profile == null) {
      return Center(child: CircularProgressIndicator(color: _t.accent));
    }

    return RefreshIndicator(
      color: _t.accent,
      backgroundColor: _t.bgCard,
      onRefresh: _loadDriverProfile,
      child: ListView(
        padding: EdgeInsets.fromLTRB(
            14, 14, 14, MediaQuery.of(context).padding.bottom + 14),
        children: [
          _buildProfileHeroCard(auth, profile),
          const SizedBox(height: 14),
          if (_gpsAccuracy != null) ...[
            _buildGpsCard(),
            const SizedBox(height: 14),
          ],
          _buildEditableSection(
            title: 'Personal Information',
            icon: Icons.badge_outlined,
            dotColor: _t.accent,
            onEdit: () => _showEditDialog(
              title: 'Edit Personal Info',
              fields: [
                _EditField('Full Name', 'full_name', profile?.fullName ?? ''),
                _EditField('Age', 'age', profile?.age ?? '',
                    keyboardType: TextInputType.number),
                _EditField('Phone', 'phone', profile?.phone ?? '',
                    keyboardType: TextInputType.phone),
                _EditField('Email', 'email', profile?.email ?? '',
                    keyboardType: TextInputType.emailAddress),
                _EditField('Address', 'address', profile?.address ?? ''),
              ],
            ),
            child: Column(children: [
              _infoRow(
                  Icons.person_outline,
                  'Full Name',
                  profile?.fullName.isNotEmpty == true
                      ? profile!.fullName
                      : '—'),
              _infoRow(Icons.cake_outlined, 'Age',
                  profile?.age.isNotEmpty == true ? profile!.age : '—'),
              _infoRow(Icons.phone_outlined, 'Phone',
                  profile?.phone.isNotEmpty == true ? profile!.phone : '—'),
              _infoRow(Icons.email_outlined, 'Email',
                  profile?.email.isNotEmpty == true ? profile!.email : '—'),
              _infoRow(Icons.location_on_outlined, 'Address',
                  profile?.address.isNotEmpty == true ? profile!.address : '—'),
            ]),
          ),
          const SizedBox(height: 14),
          _buildEditableSection(
            title: 'Vehicle & License',
            icon: Icons.directions_car_outlined,
            dotColor: _t.orange,
            onEdit: () => _showEditDialog(
              title: 'Edit Vehicle Info',
              fields: [
                _EditField(
                    'Plate Number', 'plate_number', profile?.plateNumber ?? ''),
                _EditField("Driver's License No.", 'license_number',
                    profile?.licenseNumber ?? ''),
                _EditField('Organization / TODA', 'organization',
                    profile?.organization ?? ''),
              ],
            ),
            child: Column(children: [
              _infoRow(
                  Icons.pin_outlined,
                  'Plate Number',
                  profile?.plateNumber.isNotEmpty == true
                      ? profile!.plateNumber
                      : '—'),
              _infoRow(
                  Icons.credit_card_outlined,
                  'License No.',
                  profile?.licenseNumber.isNotEmpty == true
                      ? profile!.licenseNumber
                      : '—'),
              _infoRow(
                  Icons.store_outlined,
                  'Organization',
                  profile?.organization.isNotEmpty == true
                      ? profile!.organization
                      : '—'),
            ]),
          ),
          const SizedBox(height: 14),
          _buildDocumentsSection(profile),
          const SizedBox(height: 14),
          _infoCard(
            dotColor: _t.accent,
            title: 'Account Info',
            titleIcon: Icons.manage_accounts_outlined,
            child: Column(children: [
              _infoRow(Icons.person_outline, 'Username', auth.username ?? '—'),
              _infoRow(Icons.verified_user_outlined, 'Role', 'Driver'),
              _infoRow(
                  Icons.business_outlined,
                  'Organization',
                  profile?.organization.isNotEmpty == true
                      ? profile!.organization
                      : '—'),
            ]),
          ),
          const SizedBox(height: 14),
          // ── THEME TOGGLE ─────────────────────────────────────────────
          Container(
            margin: const EdgeInsets.only(bottom: 14),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
            decoration: BoxDecoration(
              color: _t.bgCard,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: _t.border, width: 1),
            ),
            child: Row(children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color:
                      _o(_themeProvider.isDark ? _t.accent : _t.orange, 0.12),
                  borderRadius: BorderRadius.circular(9),
                ),
                child: Icon(
                  _themeProvider.isDark
                      ? Icons.dark_mode_rounded
                      : Icons.light_mode_rounded,
                  color: _themeProvider.isDark ? _t.accent : _t.orange,
                  size: 18,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _themeProvider.isDark ? 'Dark Mode' : 'Light Mode',
                        style: TextStyle(
                            color: _t.textPrimary,
                            fontSize: 13,
                            fontWeight: FontWeight.w700),
                      ),
                      Text(
                        _themeProvider.isDark
                            ? 'Tap to switch to light mode'
                            : 'Tap to switch to dark mode',
                        style: TextStyle(color: _t.textMuted, fontSize: 11),
                      ),
                    ]),
              ),
              GestureDetector(
                onTap: () => setState(() => _themeProvider.toggle()),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 250),
                  width: 48,
                  height: 28,
                  padding: const EdgeInsets.all(3),
                  decoration: BoxDecoration(
                    color:
                        _themeProvider.isDark ? _t.accent : _o(_t.orange, 0.9),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Stack(children: [
                    AnimatedAlign(
                      duration: const Duration(milliseconds: 250),
                      curve: Curves.easeInOut,
                      alignment: _themeProvider.isDark
                          ? Alignment.centerLeft
                          : Alignment.centerRight,
                      child: Container(
                        width: 22,
                        height: 22,
                        decoration: const BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          _themeProvider.isDark
                              ? Icons.dark_mode_rounded
                              : Icons.light_mode_rounded,
                          color: _themeProvider.isDark ? _t.accent : _t.orange,
                          size: 13,
                        ),
                      ),
                    ),
                  ]),
                ),
              ),
            ]),
          ),
          // ── CHANGE PASSWORD ───────────────────────────────────────────
          GestureDetector(
            onTap: () => _showChangePasswordDialog(),
            child: Container(
              margin: const EdgeInsets.only(bottom: 14),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: _o(_t.accent, 0.06),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: _o(_t.accent, 0.3)),
              ),
              child: Row(children: [
                Icon(Icons.lock_outline_rounded, color: _t.accent, size: 18),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Change Password',
                            style: TextStyle(
                                color: _t.textPrimary,
                                fontSize: 13,
                                fontWeight: FontWeight.w600)),
                        const SizedBox(height: 2),
                        Text('Update your account password',
                            style:
                                TextStyle(color: _t.textMuted, fontSize: 11)),
                      ]),
                ),
                Icon(Icons.chevron_right_rounded,
                    color: _t.textMuted, size: 20),
              ]),
            ),
          ),
          // ── SIGN OUT ──────────────────────────────────────────────────
          GestureDetector(
            onTap: () async {
              if (_isOnline) await _toggleOnline();
              await auth.logout();
              if (context.mounted) {
                Navigator.pushReplacement(context,
                    MaterialPageRoute(builder: (_) => const LoginScreen()));
              }
            },
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 13),
              decoration: BoxDecoration(
                color: _o(_t.red, 0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: _o(_t.red, 0.3), width: 1),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.logout_outlined, color: _t.red, size: 18),
                  const SizedBox(width: 7),
                  Text('Sign Out',
                      style: TextStyle(
                          color: _t.red,
                          fontWeight: FontWeight.w700,
                          fontSize: 14)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileHeroCard(AuthProvider auth, DriverProfile? profile) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: _t.bgCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _t.border, width: 1),
      ),
      child: Column(children: [
        Stack(
          children: [
            _buildAvatarWidget(radius: 40, fontSize: 30),
            Positioned(
              bottom: 0,
              right: 0,
              child: GestureDetector(
                onTap: _pickAndUploadProfilePhoto,
                child: Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: _t.accent,
                    shape: BoxShape.circle,
                    border: Border.all(color: _t.bgCard, width: 2),
                  ),
                  child: const Icon(Icons.camera_alt_rounded,
                      color: Colors.white, size: 13),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Text(
          profile?.fullName.isNotEmpty == true
              ? profile!.fullName
              : auth.username ?? 'Driver',
          style: TextStyle(
              color: _t.textPrimary, fontSize: 17, fontWeight: FontWeight.w800),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 2),
        Text('@${auth.username ?? ''}',
            style: TextStyle(color: _t.textMuted, fontSize: 11)),
        const SizedBox(height: 7),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 4),
          decoration: BoxDecoration(
            color: _o(_isOnline ? _t.green : _t.textMuted, 0.12),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
                color: _o(_isOnline ? _t.green : _t.textMuted, 0.3), width: 1),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Icon(
              _isOnline ? Icons.circle : Icons.circle_outlined,
              color: _isOnline ? _t.green : _t.textMuted,
              size: 9,
            ),
            const SizedBox(width: 4),
            Text(
              _isOnline ? 'Online — Accepting Rides' : 'Offline',
              style: TextStyle(
                  color: _isOnline ? _t.green : _t.textMuted,
                  fontSize: 11,
                  fontWeight: FontWeight.w600),
            ),
          ]),
        ),
        if (profile?.phone.isNotEmpty == true) ...[
          const SizedBox(height: 6),
          Text(profile!.phone,
              style: TextStyle(color: _t.textMuted, fontSize: 11)),
        ],
      ]),
    );
  }

  Widget _buildGpsCard() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: _t.bgCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _o(_t.green, 0.3), width: 1),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          _PulsingDot(color: _t.green),
          const SizedBox(width: 7),
          Text('Live GPS Status',
              style: TextStyle(
                  color: _t.textPrimary,
                  fontSize: 13,
                  fontWeight: FontWeight.w700)),
        ]),
        const SizedBox(height: 10),
        _infoRow(
          Icons.gps_fixed_outlined,
          'Accuracy',
          '±${_gpsAccuracy!.toStringAsFixed(0)} m ($_gpsAccuracyLabel)',
          valueColor: _gpsAccuracyColor,
        ),
        _infoRow(Icons.speed_outlined, 'Speed', _gpsSpeedLabel),
        _infoRow(
          Icons.location_on_outlined,
          'Position',
          '${_driverLocation.latitude.toStringAsFixed(5)}, '
              '${_driverLocation.longitude.toStringAsFixed(5)}',
        ),
        _infoRow(Icons.sync_outlined, 'Push',
            _isOnline ? 'Broadcasting every 2s' : 'Offline'),
      ]),
    );
  }

  Widget _buildDocumentsSection(DriverProfile? profile) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: _t.bgCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _t.border, width: 1),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(Icons.folder_outlined, color: _t.orange, size: 15),
          const SizedBox(width: 6),
          Text('Credential Documents',
              style: TextStyle(
                  color: _t.textPrimary,
                  fontSize: 13,
                  fontWeight: FontWeight.w700)),
        ]),
        const SizedBox(height: 12),
        _buildDocumentRow(
          label: "Driver's License",
          photoUrl: profile?.licensePhotoUrl,
          icon: Icons.credit_card_outlined,
          slot: _DocSlot.license,
        ),
        const SizedBox(height: 8),
        _buildDocumentRow(
          label: 'Vehicle / Plate',
          photoUrl: profile?.vehiclePhotoUrl,
          icon: Icons.directions_car_outlined,
          slot: _DocSlot.vehicle,
        ),
        const SizedBox(height: 8),
        _buildDocumentRow(
          label: 'TODA Clearance',
          photoUrl: profile?.todaPhotoUrl,
          icon: Icons.description_outlined,
          slot: _DocSlot.toda,
        ),
      ]),
    );
  }

  Widget _buildDocumentRow({
    required String label,
    required String? photoUrl,
    required IconData icon,
    required _DocSlot slot,
  }) {
    final hasPhoto = photoUrl != null && photoUrl.isNotEmpty;
    final isBase64 = hasPhoto && !photoUrl.startsWith('http');

    return GestureDetector(
      onTap: () => _pickAndUploadDocument(slot),
      child: Container(
        padding: const EdgeInsets.all(9),
        decoration: BoxDecoration(
          color: _o(hasPhoto ? _t.green : _t.textMuted, 0.06),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
              color: _o(hasPhoto ? _t.green : _t.border, 0.4), width: 1),
        ),
        child: Row(children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(7),
            child: hasPhoto
                ? (isBase64
                    ? Image.memory(base64Decode(photoUrl),
                        width: 50, height: 50, fit: BoxFit.cover)
                    : Image.network(photoUrl,
                        width: 50,
                        height: 50,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => _docPlaceholder(icon)))
                : _docPlaceholder(icon),
          ),
          const SizedBox(width: 10),
          Expanded(
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(label,
                  style: TextStyle(
                      color: _t.textPrimary,
                      fontSize: 12,
                      fontWeight: FontWeight.w600)),
              const SizedBox(height: 2),
              Row(children: [
                Icon(
                  hasPhoto
                      ? Icons.check_circle_outline_rounded
                      : Icons.upload_outlined,
                  size: 11,
                  color: hasPhoto ? _t.green : _t.textMuted,
                ),
                const SizedBox(width: 3),
                Flexible(
                  child: Text(
                    hasPhoto ? 'Uploaded — tap to replace' : 'Tap to upload',
                    style: TextStyle(
                        color: hasPhoto ? _t.green : _t.textMuted,
                        fontSize: 10),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ]),
            ]),
          ),
          Icon(Icons.chevron_right_rounded, color: _t.textMuted, size: 18),
        ]),
      ),
    );
  }

  Widget _docPlaceholder(IconData icon) {
    return Container(
      width: 50,
      height: 50,
      decoration: BoxDecoration(
        color: _o(_t.orange, 0.1),
        borderRadius: BorderRadius.circular(7),
      ),
      child: Icon(icon, color: _t.orange, size: 24),
    );
  }

  Future<void> _pickAndUploadDocument(_DocSlot slot) async {
    final picker = ImagePicker();
    final XFile? picked = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
      maxWidth: 1200,
    );
    if (picked == null) return;
    final bytes = await picked.readAsBytes();
    final base64Str = base64Encode(bytes);

    final fieldKey = slot == _DocSlot.license
        ? 'photoLicense'
        : slot == _DocSlot.vehicle
            ? 'photoPlate'
            : 'photoToda';

    final success = await _updateProfile({fieldKey: base64Str});
    if (mounted) {
      _showSnack(
        success ? 'Document updated!' : 'Failed to update document.',
        success ? _t.green : _t.red,
      );
    }
  }

  Widget _buildEditableSection({
    required String title,
    required IconData icon,
    required Color dotColor,
    required VoidCallback onEdit,
    required Widget child,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: _t.bgCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _t.border, width: 1),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(icon, color: dotColor, size: 15),
          const SizedBox(width: 6),
          Expanded(
            child: Text(title,
                style: TextStyle(
                    color: _t.textPrimary,
                    fontSize: 13,
                    fontWeight: FontWeight.w700)),
          ),
          GestureDetector(
            onTap: onEdit,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
              decoration: BoxDecoration(
                color: _o(_t.accent, 0.12),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: _o(_t.accent, 0.3)),
              ),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Icon(Icons.edit_outlined, color: _t.accent, size: 11),
                const SizedBox(width: 3),
                Text('Edit',
                    style: TextStyle(
                        color: _t.accent,
                        fontSize: 11,
                        fontWeight: FontWeight.w700)),
              ]),
            ),
          ),
        ]),
        const SizedBox(height: 10),
        child,
      ]),
    );
  }

  void _showEditDialog({
    required String title,
    required List<_EditField> fields,
  }) {
    final controllers = {
      for (final f in fields) f.key: TextEditingController(text: f.initialValue)
    };
    final errors = <String, String?>{};
    bool saving = false;

    String? validate(String key, String value) {
      final v = value.trim();
      switch (key) {
        case 'full_name':
          if (v.isEmpty) return 'Full name is required.';
          if (v.length < 2) return 'Must be at least 2 characters.';
          return null;
        case 'age':
          if (v.isEmpty) return null;
          final n = int.tryParse(v);
          if (n == null) return 'Age must be a number.';
          if (n < 16 || n > 80) return 'Age must be between 16 and 80.';
          return null;
        case 'phone':
          if (v.isEmpty) return null;
          final digits = v.replaceAll('+', '');
          if (!RegExp(r'^\d+$').hasMatch(digits) || digits.length < 10) {
            return 'Enter a valid phone number (min 10 digits).';
          }
          return null;
        case 'email':
          if (v.isEmpty) return null;
          if (!RegExp(r'^[\w\.\-]+@[\w\-]+\.\w{2,}$').hasMatch(v)) {
            return 'Enter a valid email address.';
          }
          return null;
        case 'address':
          if (v.isEmpty) return null;
          if (v.length < 5) return 'Address must be at least 5 characters.';
          return null;
        default:
          return null;
      }
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(builder: (ctx2, setSt) {
          final t = _t;
          return Padding(
            padding:
                EdgeInsets.only(bottom: MediaQuery.of(ctx2).viewInsets.bottom),
            child: SingleChildScrollView(
              child: Container(
                margin: const EdgeInsets.fromLTRB(12, 12, 12, 20),
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: t.appBarBg,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: t.border, width: 1.5),
                ),
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  Row(children: [
                    Icon(Icons.edit_outlined, color: t.accent, size: 17),
                    const SizedBox(width: 7),
                    Text(title,
                        style: TextStyle(
                            color: t.textPrimary,
                            fontSize: 15,
                            fontWeight: FontWeight.w800)),
                    const Spacer(),
                    GestureDetector(
                      onTap: () => Navigator.pop(ctx2),
                      child: Icon(Icons.close, color: t.textMuted, size: 19),
                    ),
                  ]),
                  const SizedBox(height: 18),
                  ...fields.map((f) {
                    final hasError = errors[f.key] != null;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(f.label,
                              style: TextStyle(
                                  color: hasError ? t.red : t.textMuted,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600)),
                          const SizedBox(height: 5),
                          Container(
                            decoration: BoxDecoration(
                              color: t.bgDeep,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: hasError ? t.red : t.border,
                                width: hasError ? 1.5 : 1,
                              ),
                            ),
                            child: TextField(
                              controller: controllers[f.key],
                              keyboardType: f.keyboardType,
                              style:
                                  TextStyle(color: t.textPrimary, fontSize: 13),
                              cursorColor: t.accent,
                              onChanged: (_) {
                                if (errors[f.key] != null) {
                                  setSt(() => errors[f.key] = null);
                                }
                              },
                              decoration: InputDecoration(
                                hintText: f.label,
                                hintStyle:
                                    TextStyle(color: t.textMuted, fontSize: 13),
                                border: InputBorder.none,
                                contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 12, vertical: 12),
                              ),
                            ),
                          ),
                          if (hasError) ...[
                            const SizedBox(height: 3),
                            Row(children: [
                              Icon(Icons.error_outline, color: t.red, size: 11),
                              const SizedBox(width: 3),
                              Text(errors[f.key]!,
                                  style: TextStyle(color: t.red, fontSize: 10)),
                            ]),
                          ],
                        ],
                      ),
                    );
                  }),
                  const SizedBox(height: 4),
                  GestureDetector(
                    onTap: saving
                        ? null
                        : () async {
                            bool hasErrors = false;
                            final newErrors = <String, String?>{};
                            for (final f in fields) {
                              final err =
                                  validate(f.key, controllers[f.key]!.text);
                              if (err != null) {
                                newErrors[f.key] = err;
                                hasErrors = true;
                              }
                            }
                            if (hasErrors) {
                              setSt(() => errors.addAll(newErrors));
                              return;
                            }
                            setSt(() => saving = true);
                            final updates = {
                              for (final f in fields)
                                f.key: controllers[f.key]!.text.trim()
                            };
                            final ok = await _updateProfile(updates);
                            if (ctx2.mounted) {
                              Navigator.pop(ctx2);
                            }
                            _showSnack(
                              ok
                                  ? 'Profile updated!'
                                  : 'Failed to save changes.',
                              ok ? t.green : t.red,
                            );
                          },
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      decoration: BoxDecoration(
                        color: saving ? _o(t.accent, 0.5) : t.accent,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: saving
                            ? null
                            : [
                                BoxShadow(
                                    color: _o(t.accent, 0.4),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4))
                              ],
                      ),
                      child: saving
                          ? const Center(
                              child: SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                    color: Colors.white, strokeWidth: 2),
                              ),
                            )
                          : const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.save_outlined,
                                    color: Colors.white, size: 17),
                                SizedBox(width: 7),
                                Text('Save Changes',
                                    style: TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w800,
                                        fontSize: 14)),
                              ],
                            ),
                    ),
                  ),
                ]),
              ),
            ),
          );
        });
      },
    ).whenComplete(() {
      for (final c in controllers.values) {
        c.dispose();
      }
    });
  }

  Widget _infoCard({
    required Color dotColor,
    required String title,
    required IconData titleIcon,
    required Widget child,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: _t.bgCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _t.border, width: 1),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(titleIcon, color: dotColor, size: 15),
          const SizedBox(width: 6),
          Text(title,
              style: TextStyle(
                  color: _t.textPrimary,
                  fontSize: 13,
                  fontWeight: FontWeight.w700)),
        ]),
        const SizedBox(height: 10),
        child,
      ]),
    );
  }

  Widget _infoRow(IconData icon, String label, String value,
      {Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 7),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(children: [
            Icon(icon, color: _t.textMuted, size: 13),
            const SizedBox(width: 5),
            Text(label, style: TextStyle(color: _t.textMuted, fontSize: 11)),
          ]),
          Flexible(
            child: Text(value,
                textAlign: TextAlign.right,
                style: TextStyle(
                    color: valueColor ?? _t.textPrimary,
                    fontSize: 11,
                    fontWeight: FontWeight.w600),
                overflow: TextOverflow.ellipsis),
          ),
        ],
      ),
    );
  }

  Widget _buildAvatarWidget(
      {required double radius, required double fontSize}) {
    final profile = _driverProfile;
    final photoUrl = profile?.profilePhotoUrl;
    final initial = profile?.fullName.isNotEmpty == true
        ? profile!.fullName[0].toUpperCase()
        : 'D';

    if (photoUrl != null && photoUrl.isNotEmpty) {
      final isBase64 = !photoUrl.startsWith('http');
      return CircleAvatar(
        radius: radius,
        backgroundColor: _o(_t.accent, 0.2),
        backgroundImage: isBase64
            ? MemoryImage(base64Decode(photoUrl))
            : NetworkImage(photoUrl) as ImageProvider,
        onBackgroundImageError: (_, __) {},
        child: null,
      );
    }

    return CircleAvatar(
      radius: radius,
      backgroundColor: _o(_t.accent, 0.2),
      child: Text(initial,
          style: TextStyle(
              color: _t.accent,
              fontWeight: FontWeight.w800,
              fontSize: fontSize)),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

enum _DocSlot { license, vehicle, toda }

class _EditField {
  final String label;
  final String key;
  final String initialValue;
  final TextInputType keyboardType;

  const _EditField(this.label, this.key, this.initialValue,
      {this.keyboardType = TextInputType.text});
}

// ─────────────────────────────────────────────────────────────────────────────
// RIDE REQUEST BOTTOM SHEET
// ─────────────────────────────────────────────────────────────────────────────

class _RideRequestSheet extends StatefulWidget {
  final RideRequest req;
  final FareConfig fareConfig;
  final AppThemeColors themeColors;
  final VoidCallback onAccept;
  final VoidCallback onDecline;

  const _RideRequestSheet({
    required this.req,
    required this.fareConfig,
    required this.themeColors,
    required this.onAccept,
    required this.onDecline,
  });

  @override
  State<_RideRequestSheet> createState() => _RideRequestSheetState();
}

class _RideRequestSheetState extends State<_RideRequestSheet>
    with SingleTickerProviderStateMixin {
  AppThemeColors get t => widget.themeColors;
  Color _o(Color c, double a) => c.withValues(alpha: a);

  late AnimationController _ctrl;
  late Animation<double> _scale;
  int _countdown = 30;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 350));
    _scale = CurvedAnimation(parent: _ctrl, curve: Curves.easeOutBack);
    _ctrl.forward();

    _timer = Timer.periodic(const Duration(seconds: 1), (tm) {
      if (!mounted) {
        tm.cancel();
        return;
      }
      setState(() => _countdown--);
      if (_countdown <= 0) {
        tm.cancel();
        widget.onDecline();
      }
    });
  }

  @override
  void dispose() {
    _ctrl.dispose();
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final req = widget.req;
    final cfg = widget.fareConfig;
    final displayFare =
        req.fare > 0 ? req.fare : cfg.computeFare(req.distanceKm);

    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom +
            MediaQuery.of(context).padding.bottom,
      ),
      child: SingleChildScrollView(
        child: ScaleTransition(
          scale: _scale,
          child: Container(
            margin: const EdgeInsets.fromLTRB(12, 12, 12, 20),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: t.appBarBg,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: t.border, width: 1.5),
              boxShadow: [
                BoxShadow(
                    color: _o(t.green, 0.15), blurRadius: 30, spreadRadius: 4),
              ],
            ),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              Row(children: [
                _PulsingDot(color: t.orange),
                const SizedBox(width: 8),
                Icon(Icons.directions_car_outlined,
                    color: t.textPrimary, size: 16),
                const SizedBox(width: 5),
                Expanded(
                  child: Text('New Ride Request!',
                      style: TextStyle(
                          color: t.textPrimary,
                          fontSize: 15,
                          fontWeight: FontWeight.w800)),
                ),
                SizedBox(
                  width: 38,
                  height: 38,
                  child: Stack(alignment: Alignment.center, children: [
                    CircularProgressIndicator(
                      value: _countdown / 30,
                      strokeWidth: 3,
                      backgroundColor: t.border,
                      color: _countdown > 10 ? t.green : t.red,
                    ),
                    Text('$_countdown',
                        style: TextStyle(
                            color: _countdown > 10 ? t.green : t.red,
                            fontSize: 11,
                            fontWeight: FontWeight.w700)),
                  ]),
                ),
              ]),
              const SizedBox(height: 12),
              Row(children: [
                CircleAvatar(
                  radius: 20,
                  backgroundColor: _o(t.accent, 0.2),
                  child: Text(req.passengerName[0],
                      style: TextStyle(
                          color: t.accent,
                          fontWeight: FontWeight.w900,
                          fontSize: 16)),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(req.passengerName,
                            style: TextStyle(
                                color: t.textPrimary,
                                fontWeight: FontWeight.w700,
                                fontSize: 13),
                            overflow: TextOverflow.ellipsis),
                        Row(children: [
                          Icon(Icons.straighten_outlined,
                              color: t.textMuted, size: 11),
                          const SizedBox(width: 2),
                          Text('${req.distanceKm.toStringAsFixed(1)} km route',
                              style:
                                  TextStyle(color: t.textMuted, fontSize: 11)),
                        ]),
                      ]),
                ),
                const SizedBox(width: 8),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                  decoration: BoxDecoration(
                    color: _o(t.green, 0.12),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: _o(t.green, 0.35)),
                  ),
                  child: Column(children: [
                    Text('₱${displayFare.toStringAsFixed(2)}',
                        style: TextStyle(
                            color: t.green,
                            fontWeight: FontWeight.w900,
                            fontSize: 17)),
                    if (cfg.surgeEnabled)
                      Row(mainAxisSize: MainAxisSize.min, children: [
                        Icon(Icons.bolt, color: t.orange, size: 9),
                        Text('surge ×${cfg.surgeMultiplier.toStringAsFixed(1)}',
                            style: TextStyle(
                                color: t.orange,
                                fontSize: 9,
                                fontWeight: FontWeight.w700)),
                      ])
                    else
                      Row(mainAxisSize: MainAxisSize.min, children: [
                        Icon(Icons.credit_card_outlined,
                            color: t.textMuted, size: 9),
                        const SizedBox(width: 2),
                        Text('fare',
                            style: TextStyle(color: t.textMuted, fontSize: 9)),
                      ]),
                  ]),
                ),
              ]),
              const SizedBox(height: 9),
              Container(
                padding: const EdgeInsets.all(9),
                decoration: BoxDecoration(
                  color: t.bgCard,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: t.border),
                ),
                child: Column(children: [
                  _fareRow(
                      t, 'Base fare', '₱${cfg.baseFare.toStringAsFixed(2)}'),
                  _fareRow(
                      t,
                      '${req.distanceKm.toStringAsFixed(1)} km × ₱${cfg.perKmRate.toStringAsFixed(2)}',
                      '₱${(req.distanceKm * cfg.perKmRate).toStringAsFixed(2)}'),
                  if (cfg.surgeEnabled)
                    _fareRow(
                        t,
                        'Surge ×${cfg.surgeMultiplier.toStringAsFixed(1)}',
                        '+${((cfg.surgeMultiplier - 1) * 100).toStringAsFixed(0)}%',
                        valueColor: t.orange),
                  if (cfg.bookingFee > 0)
                    _fareRow(t, 'Booking fee',
                        '₱${cfg.bookingFee.toStringAsFixed(2)}'),
                  Divider(color: t.border, height: 10),
                  _fareRow(t, 'TOTAL', '₱${displayFare.toStringAsFixed(2)}',
                      bold: true, valueColor: t.green),
                ]),
              ),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: t.bgCard,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: t.border),
                ),
                child: Column(children: [
                  _routeLine(t, Icons.radio_button_checked, t.green, 'Pickup',
                      req.pickupLabel),
                  Padding(
                    padding: const EdgeInsets.only(left: 8),
                    child: Column(
                      children: List.generate(
                          3,
                          (_) => Container(
                                margin: const EdgeInsets.symmetric(vertical: 2),
                                width: 1.5,
                                height: 4,
                                color: t.border,
                              )),
                    ),
                  ),
                  _routeLine(t, Icons.location_on_outlined, t.red, 'Dropoff',
                      req.dropoffLabel),
                ]),
              ),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(
                  child: GestureDetector(
                    onTap: widget.onDecline,
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        color: _o(t.red, 0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: _o(t.red, 0.3)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.close, color: t.red, size: 15),
                          const SizedBox(width: 5),
                          Text('Decline',
                              style: TextStyle(
                                  color: t.red,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 13)),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  flex: 2,
                  child: GestureDetector(
                    onTap: widget.onAccept,
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        color: t.green,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                              color: _o(t.green, 0.4),
                              blurRadius: 12,
                              offset: const Offset(0, 4)),
                        ],
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.check_circle_outline,
                              color: Colors.white, size: 16),
                          const SizedBox(width: 5),
                          const Text('Accept Ride',
                              style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 13)),
                        ],
                      ),
                    ),
                  ),
                ),
              ]),
            ]),
          ),
        ),
      ),
    );
  }

  Widget _fareRow(AppThemeColors t, String label, String value,
      {bool bold = false, Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Flexible(
          child: Text(label,
              style: TextStyle(
                  color: bold ? t.textPrimary : t.textMuted,
                  fontSize: 11,
                  fontWeight: bold ? FontWeight.w700 : FontWeight.normal),
              overflow: TextOverflow.ellipsis),
        ),
        const SizedBox(width: 6),
        Text(value,
            style: TextStyle(
                color: valueColor ?? (bold ? t.green : t.textPrimary),
                fontSize: 11,
                fontWeight: bold ? FontWeight.w800 : FontWeight.w600)),
      ]),
    );
  }

  Widget _routeLine(
      AppThemeColors t, IconData icon, Color color, String label, String sub) {
    return Row(children: [
      Icon(icon, color: color, size: 16),
      const SizedBox(width: 8),
      Expanded(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label,
              style: TextStyle(
                  color: color, fontSize: 9, fontWeight: FontWeight.w600)),
          Text(sub,
              style: TextStyle(color: t.textPrimary, fontSize: 11),
              overflow: TextOverflow.ellipsis),
        ]),
      ),
    ]);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM MAP MARKERS
// ─────────────────────────────────────────────────────────────────────────────

class _DriverMarker extends StatefulWidget {
  final bool isOnline;
  final Color onlineColor;
  final Color offlineColor;

  const _DriverMarker({
    required this.isOnline,
    required this.onlineColor,
    required this.offlineColor,
  });

  @override
  State<_DriverMarker> createState() => _DriverMarkerState();
}

class _DriverMarkerState extends State<_DriverMarker>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _pulse;

  @override
  void initState() {
    super.initState();
    _ctrl =
        AnimationController(vsync: this, duration: const Duration(seconds: 1))
          ..repeat(reverse: true);
    _pulse = Tween(begin: 0.85, end: 1.15)
        .animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final color = widget.isOnline ? widget.onlineColor : widget.offlineColor;

    return AnimatedBuilder(
      animation: _pulse,
      builder: (_, __) => Transform.scale(
        scale: widget.isOnline ? _pulse.value : 1.0,
        child: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: color,
            border: Border.all(color: Colors.white, width: 2.5),
            boxShadow: [
              BoxShadow(
                  color: color.withValues(alpha: 0.5),
                  blurRadius: 12,
                  spreadRadius: 2),
            ],
          ),
          child: const Center(
            child: Icon(Icons.directions_car, color: Colors.white, size: 22),
          ),
        ),
      ),
    );
  }
}

class _RouteMarker extends StatelessWidget {
  final Color color;
  final IconData icon;
  final String label;

  const _RouteMarker({
    required this.color,
    required this.icon,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Column(mainAxisSize: MainAxisSize.min, children: [
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(6),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withValues(alpha: 0.2), blurRadius: 6),
          ],
        ),
        child: Text(label,
            style: TextStyle(
                color: color, fontSize: 9, fontWeight: FontWeight.w700)),
      ),
      const SizedBox(height: 2),
      Icon(icon, color: color, size: 26),
    ]);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PULSING DOT
// ─────────────────────────────────────────────────────────────────────────────

class _PulsingDot extends StatefulWidget {
  final Color color;
  const _PulsingDot({required this.color});
  @override
  State<_PulsingDot> createState() => _PulsingDotState();
}

class _PulsingDotState extends State<_PulsingDot>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 800))
      ..repeat(reverse: true);
    _anim = Tween(begin: 0.5, end: 1.0).animate(_ctrl);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _anim,
      builder: (_, __) => Container(
        width: 10,
        height: 10,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: widget.color.withValues(alpha: _anim.value),
          boxShadow: [
            BoxShadow(
                color: widget.color.withValues(alpha: 0.45),
                blurRadius: 8 * _anim.value,
                spreadRadius: 2 * _anim.value),
          ],
        ),
      ),
    );
  }
}
