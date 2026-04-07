package com.pasadanow.finalproject.controller;

import com.pasadanow.finalproject.dto.RideRequest;
import com.pasadanow.finalproject.model.Ride;
import com.pasadanow.finalproject.repository.RideRepository;
import com.pasadanow.finalproject.service.RideService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rides")
public class RideController {

    @Autowired
    private RideService rideService;

    @Autowired
    private RideRepository rideRepository;

    @PostMapping("/book")
    public ResponseEntity<Ride> bookRide(@RequestBody RideRequest request) {
        return ResponseEntity.ok(rideService.bookRide(request));
    }

    @PatchMapping("/{rideId}/accept")
    public ResponseEntity<Ride> acceptRide(
            @PathVariable Long rideId,
            @RequestParam Long driverId) {
        return ResponseEntity.ok(rideService.acceptRide(rideId, driverId));
    }

    @PatchMapping("/{rideId}/complete")
    public ResponseEntity<Ride> completeRide(@PathVariable Long rideId) {
        return ResponseEntity.ok(rideService.completeRide(rideId));
    }

    @PatchMapping("/{rideId}/cancel")
    public ResponseEntity<Ride> cancelRide(@PathVariable Long rideId) {
        return ResponseEntity.ok(rideService.cancelRide(rideId));
    }

    @GetMapping("/rider/{riderId}")
    public ResponseEntity<List<Ride>> getRiderRides(@PathVariable Long riderId) {
        return ResponseEntity.ok(rideRepository.findByRiderId(riderId));
    }

    @GetMapping("/driver/{driverId}")
    public ResponseEntity<List<Ride>> getDriverRides(@PathVariable Long driverId) {
        return ResponseEntity.ok(rideRepository.findByDriverId(driverId));
    }
}