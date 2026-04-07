package com.pasadanow.finalproject.repository;

import com.pasadanow.finalproject.model.Ride;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RideRepository extends JpaRepository<Ride, Long> {
    List<Ride> findByRiderId(Long riderId);

    List<Ride> findByDriverId(Long driverId);

    List<Ride> findByStatus(com.pasadanow.finalproject.model.RideStatus status);
}