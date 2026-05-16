package com.pasadanow.FinalProject.repository;

import com.pasadanow.FinalProject.model.PasswordResetToken;

import jakarta.transaction.Transactional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findTopByEmailOrderByExpiresAtDesc(String email);

    @Transactional
    @Modifying
    void deleteAllByEmail(String email);
}