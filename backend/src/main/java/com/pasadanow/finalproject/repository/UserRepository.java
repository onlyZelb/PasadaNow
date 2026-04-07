package com.pasadanow.finalproject.repository;

import com.pasadanow.finalproject.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    // 🔥 needed by AjaxController
    List<User> findByRole(String role);

    long countByRole(String role);
}