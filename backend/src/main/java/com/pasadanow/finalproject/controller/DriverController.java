package com.pasadanow.finalproject.controller;

import com.pasadanow.finalproject.model.Driver;
import com.pasadanow.finalproject.repository.DriverRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/drivers")
public class DriverController {

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * POST /api/drivers/{driverId}/availability
     * Body: { "available": true | false }
     *
     * Called by the driver dashboard when toggling Go Online / Go Offline.
     * Saves the state to DB then broadcasts on /topic/drivers so all
     * connected commuter dashboards refresh their driver list immediately.
     */
    @PostMapping("/{driverId}/availability")
    public ResponseEntity<?> setAvailability(
            @PathVariable Long driverId,
            @RequestBody Map<String, Boolean> body) {

        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found: " + driverId));

        boolean available = Boolean.TRUE.equals(body.get("available"));
        driver.setAvailable(available);
        driverRepository.save(driver);

        // Broadcast to /topic/drivers so every commuter WebSocket subscriber
        // calls loadDrivers() and sees the updated list in real time.
        Map<String, Object> payload = Map.of("driverId", driverId, "available", available);
        messagingTemplate.convertAndSend("/topic/drivers", (Object) payload);

        return ResponseEntity.ok(Map.of("success", true, "available", available));
    }

    /**
     * GET /api/drivers/online
     *
     * Returns the list of drivers whose available flag is true.
     * Called by CommuterDashboard on mount and every 5 s as a polling fallback.
     */
    @GetMapping("/online")
    public ResponseEntity<List<Driver>> getOnlineDrivers() {
        return ResponseEntity.ok(driverRepository.findByAvailableTrue());
    }
}