package com.pasadanow.FinalProject.repository;

import com.pasadanow.FinalProject.model.Commuter;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CommuterRepository extends JpaRepository<Commuter, Long> {
    Optional<Commuter> findByUsername(String username);
    Optional<Commuter> findByEmail(String email);   // ← used by /api/auth/google
    boolean existsByUsername(String username);
}