package com.pasadanow.finalproject.controller;

import com.pasadanow.finalproject.model.Ride;
import com.pasadanow.finalproject.model.RideStatus;
import com.pasadanow.finalproject.model.User;
import com.pasadanow.finalproject.repository.RideRepository;
import com.pasadanow.finalproject.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/")
@CrossOrigin(origins = "*")
public class AjaxController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RideRepository rideRepository;

    // ── Helper: get current logged-in user ID from JWT cookie ──────────────
    private Long getCurrentUserId() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated())
            return null;

        Object principal = auth.getPrincipal();
        if (!(principal instanceof UserDetails))
            return null;

        String username = ((UserDetails) principal).getUsername();
        return userRepository.findByUsername(username)
                .map(User::getId)
                .orElse(null);
    }

    // ─────────────────────────────────────────
    // COMMUTER ENDPOINTS
    // ─────────────────────────────────────────

    // GET all online drivers
    @GetMapping(params = "ajax=get_drivers")
    public ResponseEntity<List<Map<String, Object>>> getDrivers() {
        List<User> drivers = userRepository.findByRole("driver");

        List<Map<String, Object>> result = drivers.stream().map(d -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", d.getId());
            m.put("username", d.getUsername());
            m.put("plate_number", d.getPlateNo());
            m.put("contact_no", d.getPhone());
            m.put("organization", d.getTodaNo());
            return m;
        }).toList();

        return ResponseEntity.ok(result);
    }

    // GET driver count
    @GetMapping(params = "ajax=driver_count")
    public ResponseEntity<Map<String, Object>> getDriverCount() {
        Map<String, Object> res = new HashMap<>();
        res.put("count", userRepository.countByRole("driver"));
        return ResponseEntity.ok(res);
    }

    // GET commuter trip history
    @GetMapping(params = "ajax=history")
    public ResponseEntity<List<Map<String, Object>>> getCommuterHistory() {
        Long userId = getCurrentUserId();
        if (userId == null)
            return ResponseEntity.ok(Collections.emptyList());

        List<Ride> rides = rideRepository.findByRiderIdOrderByCreatedAtDesc(userId);

        List<Map<String, Object>> result = rides.stream().map(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", r.getId());
            m.put("origin", r.getPickup());
            m.put("destination", r.getDropoff());
            m.put("fare", r.getFare());
            m.put("status", r.getStatus().name().toLowerCase());
            m.put("created_at", r.getCreatedAt());

            userRepository.findById(r.getDriverId())
                    .ifPresent(d -> m.put("driver", d.getUsername()));

            return m;
        }).toList();

        return ResponseEntity.ok(result);
    }

    // POST book a ride
    @PostMapping(params = "ajax_book=1")
    public ResponseEntity<Map<String, Object>> bookRide(
            @RequestParam String origin,
            @RequestParam String destination,
            @RequestParam Long driver_id,
            @RequestParam Integer fare) {

        Map<String, Object> res = new HashMap<>();
        Long riderId = getCurrentUserId();

        if (riderId == null) {
            res.put("success", false);
            res.put("message", "Not authenticated.");
            return ResponseEntity.ok(res);
        }

        Ride ride = new Ride();
        ride.setRiderId(riderId);
        ride.setDriverId(driver_id);
        ride.setPickup(origin);
        ride.setDropoff(destination);
        ride.setFare(fare);
        ride.setStatus(RideStatus.PENDING);
        rideRepository.save(ride);

        res.put("success", true);
        res.put("booking_id", ride.getId());
        return ResponseEntity.ok(res);
    }

    // GET poll booking status
    @GetMapping(params = "ajax=poll_booking")
    public ResponseEntity<Map<String, Object>> pollBooking(@RequestParam Long booking_id) {
        Optional<Ride> opt = rideRepository.findById(booking_id);
        if (opt.isEmpty())
            return ResponseEntity.ok(Collections.emptyMap());

        Ride r = opt.get();

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", r.getId());
        m.put("status", r.getStatus().name().toLowerCase());
        m.put("origin", r.getPickup());
        m.put("destination", r.getDropoff());
        m.put("fare", r.getFare());

        userRepository.findById(r.getDriverId()).ifPresent(driver -> {
            m.put("driver_name", driver.getUsername());
            m.put("plate_number", driver.getPlateNo());
            m.put("contact_no", driver.getPhone());
        });

        return ResponseEntity.ok(m);
    }

    // GET cancel booking
    @GetMapping(params = "ajax=cancel_booking")
    public ResponseEntity<Map<String, Object>> cancelBooking() {
        Long userId = getCurrentUserId();
        Map<String, Object> res = new HashMap<>();

        if (userId == null) {
            res.put("success", false);
            return ResponseEntity.ok(res);
        }

        List<Ride> rides = rideRepository.findByRiderIdAndStatus(userId, RideStatus.PENDING);
        rides.forEach(r -> r.setStatus(RideStatus.CANCELLED));
        rideRepository.saveAll(rides);

        res.put("success", true);
        return ResponseEntity.ok(res);
    }

    // ─────────────────────────────────────────
    // DRIVER ENDPOINTS
    // ─────────────────────────────────────────

    // GET pending notifications for driver
    @GetMapping(params = "ajax=notif_list")
    public ResponseEntity<Map<String, Object>> getNotifList() {
        Long driverId = getCurrentUserId();
        Map<String, Object> res = new HashMap<>();

        if (driverId == null) {
            res.put("notifs", Collections.emptyList());
            return ResponseEntity.ok(res);
        }

        List<Ride> pending = rideRepository.findByDriverIdAndStatus(driverId, RideStatus.PENDING);

        List<Map<String, Object>> notifs = pending.stream().map(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", r.getId());
            m.put("origin", r.getPickup());
            m.put("destination", r.getDropoff());
            m.put("fare", r.getFare());

            userRepository.findById(r.getRiderId())
                    .ifPresent(u -> m.put("commuter_name", u.getUsername()));

            return m;
        }).toList();

        res.put("notifs", notifs);
        return ResponseEntity.ok(res);
    }

    // GET notification count
    @GetMapping(params = "ajax=notif_count")
    public ResponseEntity<Map<String, Object>> getNotifCount() {
        Long driverId = getCurrentUserId();
        Map<String, Object> res = new HashMap<>();

        if (driverId == null) {
            res.put("count", 0);
            return ResponseEntity.ok(res);
        }

        long count = rideRepository.countByDriverIdAndStatus(driverId, RideStatus.PENDING);
        res.put("count", count);
        return ResponseEntity.ok(res);
    }

    // POST update ride status (driver accepts/declines/starts/completes)
    @PostMapping(params = "ajax=update_status")
    public ResponseEntity<Map<String, Object>> updateRideStatus(
            @RequestParam String status,
            @RequestParam Long trip_id) {

        Map<String, Object> res = new HashMap<>();

        Optional<Ride> opt = rideRepository.findById(trip_id);
        if (opt.isEmpty()) {
            res.put("success", false);
            return ResponseEntity.ok(res);
        }

        Ride ride = opt.get();

        try {
            // frontend sends "accepted", "declined", "ongoing", "completed"
            String normalized = status.toUpperCase();
            if (normalized.equals("DECLINED"))
                normalized = "CANCELLED";
            ride.setStatus(RideStatus.valueOf(normalized));
        } catch (IllegalArgumentException e) {
            res.put("success", false);
            res.put("message", "Invalid status: " + status);
            return ResponseEntity.ok(res);
        }

        rideRepository.save(ride);
        res.put("success", true);
        return ResponseEntity.ok(res);
    }

    // GET check for pending ride request (driver polling)
    @GetMapping(params = "ajax=check_request")
    public ResponseEntity<Map<String, Object>> checkRequest() {
        Long driverId = getCurrentUserId();
        if (driverId == null)
            return ResponseEntity.ok(Collections.emptyMap());

        List<Ride> pending = rideRepository.findByDriverIdAndStatus(driverId, RideStatus.PENDING);
        if (pending.isEmpty())
            return ResponseEntity.ok(Collections.emptyMap());

        Ride r = pending.get(0);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", r.getId());
        m.put("origin", r.getPickup());
        m.put("destination", r.getDropoff());
        m.put("fare", r.getFare());

        userRepository.findById(r.getRiderId())
                .ifPresent(u -> {
                    m.put("commuter_name", u.getUsername());
                    m.put("commuter_phone", u.getPhone());
                });

        return ResponseEntity.ok(m);
    }

    // GET driver stats
    @GetMapping(params = "ajax=driver_stats")
    public ResponseEntity<Map<String, Object>> getDriverStats() {
        Long driverId = getCurrentUserId();
        Map<String, Object> res = new HashMap<>();

        if (driverId == null)
            return ResponseEntity.ok(res);

        List<Ride> completed = rideRepository.findByDriverIdAndStatus(driverId, RideStatus.COMPLETED);

        double totalEarned = completed.stream()
                .mapToDouble(r -> r.getFare() != null ? r.getFare() : 0)
                .sum();

        res.put("totalEarned", totalEarned);
        res.put("totalTrips", completed.size());
        res.put("todayEarned", 0); // extend with date filter if needed
        res.put("todayTrips", 0);
        return ResponseEntity.ok(res);
    }

    // GET driver history
    @GetMapping(params = "ajax=driver_history")
    public ResponseEntity<List<Map<String, Object>>> getDriverHistory() {
        Long driverId = getCurrentUserId();
        if (driverId == null)
            return ResponseEntity.ok(Collections.emptyList());

        List<Ride> rides = rideRepository.findByDriverIdOrderByCreatedAtDesc(driverId);

        List<Map<String, Object>> result = rides.stream().map(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", r.getId());
            m.put("origin", r.getPickup());
            m.put("destination", r.getDropoff());
            m.put("fare", r.getFare());
            m.put("status", r.getStatus().name().toLowerCase());
            m.put("created_at", r.getCreatedAt());

            userRepository.findById(r.getRiderId())
                    .ifPresent(u -> m.put("commuter", u.getUsername()));

            return m;
        }).toList();

        return ResponseEntity.ok(result);
    }

    // GET driver profile
    @GetMapping(params = "ajax=driver_profile")
    public ResponseEntity<Map<String, Object>> getDriverProfile() {
        Long driverId = getCurrentUserId();
        if (driverId == null)
            return ResponseEntity.ok(Collections.emptyMap());

        return userRepository.findById(driverId).map(d -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", d.getId());
            m.put("username", d.getUsername());
            m.put("email", d.getEmail());
            m.put("phone", d.getPhone());
            m.put("plate_number", d.getPlateNo());
            m.put("license_no", d.getLicenseNo());
            m.put("organization", d.getTodaNo());
            m.put("contact_no", d.getPhone());
            m.put("is_available", true);
            return ResponseEntity.ok(m);
        }).orElse(ResponseEntity.ok(Collections.emptyMap()));
    }
}