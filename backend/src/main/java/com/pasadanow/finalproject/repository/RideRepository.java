package com.pasadanow.finalproject.repository;

import com.pasadanow.finalproject.model.Ride;
import com.pasadanow.finalproject.model.RideStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RideRepository extends JpaRepository<Ride, Long> {

    // ── Commuter queries ─────────────────────
    List<Ride> findByRiderIdOrderByCreatedAtDesc(Long riderId);

    List<Ride> findByRiderId(Long riderId);

    List<Ride> findByRiderIdAndStatus(Long riderId, RideStatus status);

    // ── Driver queries ───────────────────────
    List<Ride> findByDriverIdOrderByCreatedAtDesc(Long driverId);

    List<Ride> findByDriverId(Long driverId);

    List<Ride> findByDriverIdAndStatus(Long driverId, RideStatus status);

    long countByDriverIdAndStatus(Long driverId, RideStatus status);
}