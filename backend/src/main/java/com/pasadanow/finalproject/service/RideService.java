package com.pasadanow.finalproject.service;

import com.pasadanow.finalproject.dto.RideRequest;
import com.pasadanow.finalproject.model.Ride;
import com.pasadanow.finalproject.model.RideStatus;
import com.pasadanow.finalproject.repository.RideRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;

import java.util.HashMap;
import java.util.Map;

@Service
public class RideService {

    private static final Map<String, Integer> FARE_MAP = Map.of(
            "Trike", 35,
            "Tricab", 55);

    @Autowired
    private RideRepository rideRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private double getFareFromDjango(double pickupLat, double pickupLng,
            double dropoffLat, double dropoffLng) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            String djangoUrl = "http://django:8000/api/rides/fare/";

            Map<String, Double> body = new HashMap<>();
            body.put("pickup_lat", pickupLat);
            body.put("pickup_lng", pickupLng);
            body.put("dropoff_lat", dropoffLat);
            body.put("dropoff_lng", dropoffLng);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Double>> entity = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(djangoUrl, entity, Map.class);
            return ((Number) response.getBody().get("fare_php")).doubleValue();
        } catch (Exception e) {
            System.err.println("Django fare service unreachable: " + e.getMessage());
            return -1;
        }
    }

    public Ride bookRide(RideRequest request) {
        Ride ride = new Ride();
        ride.setRiderId(request.getRiderId());
        ride.setPickup(request.getPickup());
        ride.setDropoff(request.getDropoff());
        ride.setFareType(request.getFareType());

        double djangoFare = -1;
        if (request.getPickupLat() != 0 && request.getDropoffLat() != 0) {
            djangoFare = getFareFromDjango(
                    request.getPickupLat(), request.getPickupLng(),
                    request.getDropoffLat(), request.getDropoffLng());
        }

        if (djangoFare > 0) {
            ride.setFare((int) Math.round(djangoFare));
        } else {
            ride.setFare(FARE_MAP.getOrDefault(request.getFareType(), 35));
        }

        ride.setStatus(RideStatus.PENDING);
        Ride saved = rideRepository.save(ride);
        messagingTemplate.convertAndSend("/topic/rides", saved);
        return saved;
    }

    public Ride acceptRide(Long rideId, Long driverId) {
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found"));

        if (ride.getStatus() != RideStatus.PENDING) {
            throw new RuntimeException("Ride is no longer available");
        }

        ride.setDriverId(driverId);
        ride.setStatus(RideStatus.ACCEPTED);
        Ride updated = rideRepository.save(ride);
        messagingTemplate.convertAndSend("/topic/rider/" + ride.getRiderId(), updated);
        return updated;
    }

    public Ride completeRide(Long rideId) {
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found"));

        ride.setStatus(RideStatus.COMPLETED);
        Ride completed = rideRepository.save(ride);
        messagingTemplate.convertAndSend("/topic/rider/" + ride.getRiderId(), completed);
        return completed;
    }

    public Ride cancelRide(Long rideId) {
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found"));

        ride.setStatus(RideStatus.CANCELLED);
        return rideRepository.save(ride);
    }
}