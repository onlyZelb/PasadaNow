package com.pasadanow.finalproject.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.pasadanow.finalproject.dto.LoginRequest;
import com.pasadanow.finalproject.dto.SignupRequest;
import com.pasadanow.finalproject.model.User;
import com.pasadanow.finalproject.repository.UserRepository;
import com.pasadanow.finalproject.security.JwtUtils;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder encoder;

    @Autowired
    private JwtUtils jwtUtils;

    @Value("${jwt.expiration}")
    private int jwtExpirationMs;

    @Value("${jwt.cookie.domain}")
    private String jwtDomain;

    // ── helpers ──────────────────────────────────────────────

    private Cookie buildJwtCookie(String token) {
        Cookie cookie = new Cookie("jwt", token);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setDomain(jwtDomain); // share across all localhost ports
        cookie.setMaxAge(jwtExpirationMs / 1000); // convert ms → seconds
        // cookie.setSecure(true); // uncomment in production (HTTPS)
        return cookie;
    }

    private Cookie expiredJwtCookie() {
        Cookie cookie = new Cookie("jwt", "");
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setDomain(jwtDomain);
        cookie.setMaxAge(0); // immediately expire
        return cookie;
    }

    // ── endpoints ────────────────────────────────────────────

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest,
                                   HttpServletResponse response) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsername(), loginRequest.getPassword()));

            String jwt = jwtUtils.generateToken(authentication.getName());
            response.addCookie(buildJwtCookie(jwt));
            return ResponseEntity.ok(Map.of("username", authentication.getName()));

        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid username or password"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Authentication failed"));
        }
    }

@PostMapping("/register")
public ResponseEntity<?> register(@RequestBody SignupRequest req,
                                  HttpServletResponse response) {

    if (userRepository.findByUsername(req.getUsername()).isPresent()) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", "Username is already taken"));
    }

    // Map the role string from the frontend to the Spring Security role format
    String role = "driver".equalsIgnoreCase(req.getRole())
            ? "ROLE_DRIVER"
            : "ROLE_USER";   // default → commuter

    User user = new User(
            req.getUsername(),
            encoder.encode(req.getPassword()),
            role,
            req.getFullName(),
            req.getPhone(),
            req.getEmail(),
            req.getLicenseNo(),
            req.getPlateNo(),
            req.getTodaNo()
    );
    userRepository.save(user);

    String jwt = jwtUtils.generateToken(req.getUsername());
    response.addCookie(buildJwtCookie(jwt));
    return ResponseEntity.ok(Map.of("username", req.getUsername()));
}

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        response.addCookie(expiredJwtCookie());
        return ResponseEntity.ok(Map.of("message", "Logged out"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(Map.of("username", auth.getName()));
    }
}