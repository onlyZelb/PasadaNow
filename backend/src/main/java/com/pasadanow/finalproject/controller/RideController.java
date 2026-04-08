package com.pasadanow.finalproject.controller;

import com.pasadanow.finalproject.dto.RideRequest;
import com.pasadanow.finalproject.model.Ride;
import com.pasadanow.finalproject.repository.RideRepository;
import com.pasadanow.finalproject.service.RideService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rides")
public class RideController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private RideService rideService;

    @Autowired
    private RideRepository rideRepository;

    /**
     * POST /api/rides/book
     * Called by the commuter to create a new ride. Returns the saved Ride with its
     * ID.
     */
    @PostMapping("/book")
    public ResponseEntity<Ride> bookRide(@RequestBody RideRequest request) {
        return ResponseEntity.ok(rideService.bookRide(request));
    }

    /**
     * POST /api/rides/{rideId}/assign?driverId={driverId}
     *
     * FIX: New endpoint — called right after /book to link a specific driver
     * to the ride and push the request to that driver via WebSocket.
     * Without this, the driver never receives the ride notification.
     */
    @PostMapping("/{rideId}/assign")
    public ResponseEntity<Ride> assignDriver(
            @PathVariable Long rideId,
            @RequestParam Long driverId) {

        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found: " + rideId));

        ride.setDriverId(driverId);
        Ride saved = rideRepository.save(ride);

        // Push the ride directly to this driver's personal topic.
        // DriverDashboard subscribes to /topic/driver/{userId} and will
        // display the ride request card when this message arrives.
        messagingTemplate.convertAndSend("/topic/driver/" + driverId, saved);

        // Also broadcast on the shared topic as a fallback
        messagingTemplate.convertAndSend("/topic/rides", saved);

        return ResponseEntity.ok(saved);
    }

    /**
     * PATCH /api/rides/{rideId}/accept?driverId={driverId}
     * Driver accepts the ride — status → ACCEPTED, notifies commuter.
     */
    @PatchMapping("/{rideId}/accept")
    public ResponseEntity<Ride> acceptRide(
            @PathVariable Long rideId,
            @RequestParam Long driverId) {
        return ResponseEntity.ok(rideService.acceptRide(rideId, driverId));
    }

    /**
     * PATCH /api/rides/{rideId}/complete
     * Driver marks ride complete — status → COMPLETED, notifies commuter.
     */
    @PatchMapping("/{rideId}/complete")
    public ResponseEntity<Ride> completeRide(@PathVariable Long rideId) {
        return ResponseEntity.ok(rideService.completeRide(rideId));
    }

    /**
     * PATCH /api/rides/{rideId}/cancel
     * Cancels a ride (called by either party).
     */
    @PatchMapping("/{rideId}/cancel")
    public ResponseEntity<Ride> cancelRide(@PathVariable Long rideId) {
        return ResponseEntity.ok(rideService.cancelRide(rideId));
    }

    /**
     * GET /api/rides/rider/{riderId}
     * Returns all rides for a specific commuter.
     */
    @GetMapping("/rider/{riderId}")
    public ResponseEntity<List<Ride>> getRiderRides(@PathVariable Long riderId) {
        return ResponseEntity.ok(rideRepository.findByRiderId(riderId));
    }

    /**
     * GET /api/rides/driver/{driverId}
     * Returns all rides for a specific driver.
     */
    @GetMapping("/driver/{driverId}")
    public ResponseEntity<List<Ride>> getDriverRides(@PathVariable Long driverId) {
        return ResponseEntity.ok(rideRepository.findByDriverId(driverId));
    }
}