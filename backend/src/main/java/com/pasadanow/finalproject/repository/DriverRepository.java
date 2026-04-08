package com.pasadanow.finalproject.repository;

import com.pasadanow.finalproject.model.Driver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DriverRepository extends JpaRepository<Driver, Long> {

    /**
     * Returns all drivers where available = true.
     * Used by GET /api/drivers/online to populate the commuter's driver list.
     */
    List<Driver> findByAvailableTrue();

    Optional<Driver> findByUsername(String username);
}