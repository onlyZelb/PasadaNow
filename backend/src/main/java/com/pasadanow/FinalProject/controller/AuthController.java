package com.pasadanow.FinalProject.controller;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.pasadanow.FinalProject.dto.*;
import com.pasadanow.FinalProject.model.*;
import com.pasadanow.FinalProject.repository.*;
import com.pasadanow.FinalProject.security.JwtUtils;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;
    @Autowired
    private CommuterRepository commuterRepo;
    @Autowired
    private DriverRepository driverRepo;
    @Autowired
    private PasswordResetTokenRepository resetTokenRepo;
    @Autowired
    private PasswordEncoder encoder;
    @Autowired
    private JwtUtils jwtUtils;
    @Autowired
    private JavaMailSender mailSender;

    @Value("${jwt.expiration}")
    private int jwtExpirationMs;

    @Value("${jwt.cookie.domain}")
    private String jwtDomain;

    @Value("${google.client.id}")
    private String googleClientId;

    @Value("${spring.mail.username}")
    private String fromEmail;

    // ── Cookie helpers ────────────────────────────────────────────────────────
    private Cookie buildJwtCookie(String token) {
        Cookie cookie = new Cookie("jwt", token);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setDomain(jwtDomain);
        cookie.setMaxAge(jwtExpirationMs / 1000);
        return cookie;
    }

    private Cookie expiredJwtCookie() {
        Cookie cookie = new Cookie("jwt", "");
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setDomain(jwtDomain);
        cookie.setMaxAge(0);
        return cookie;
    }

    // ── Local login ───────────────────────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req,
            HttpServletResponse response) {
        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            req.getUsername(), req.getPassword()));

            String role;
            String verifiedStatus;

            Optional<Commuter> commuter = commuterRepo.findByUsername(req.getUsername());
            if (commuter.isPresent()) {
                role = "ROLE_COMMUTER";
                verifiedStatus = commuter.get().getVerifiedStatus();
            } else {
                Driver d = driverRepo.findByUsername(req.getUsername()).orElseThrow();
                role = "ROLE_DRIVER";
                verifiedStatus = d.getVerifiedStatus();
            }

            String jwt = jwtUtils.generateToken(auth.getName());
            response.addCookie(buildJwtCookie(jwt));
            return ResponseEntity.ok(
                    new JwtResponse(jwt, auth.getName(), role, verifiedStatus));

        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid username or password"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Authentication failed"));
        }
    }

    // ── Google login ──────────────────────────────────────────────────────────
    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, Object> body,
            HttpServletResponse response) {
        try {
            String email;
            String fullName;

            boolean isAccessToken = Boolean.TRUE.equals(body.get("isAccessToken"));

            if (isAccessToken) {
                email = (String) body.get("email");
                fullName = (String) body.get("displayName");
                if (email == null) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(Map.of("message", "Missing email from Google."));
                }
            } else {
                GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                        new NetHttpTransport(), new GsonFactory())
                        .setAudience(Collections.singletonList(googleClientId))
                        .build();

                GoogleIdToken idToken = verifier.verify((String) body.get("token"));
                if (idToken == null) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(Map.of("message", "Invalid Google ID token."));
                }

                GoogleIdToken.Payload payload = idToken.getPayload();
                email = payload.getEmail();
                fullName = (String) payload.get("name");
            }

            String username = email.split("@")[0];

            Commuter commuter = commuterRepo.findByEmail(email).orElse(null);

            if (commuter == null) {
                if (commuterRepo.existsByUsername(username) ||
                        driverRepo.existsByUsername(username)) {
                    username = username + "_" + UUID.randomUUID().toString().substring(0, 5);
                }
                commuter = new Commuter(
                        username,
                        encoder.encode(UUID.randomUUID().toString()),
                        fullName != null ? fullName : username,
                        "",
                        email);
                commuter.setVerifiedStatus("verified");
                commuterRepo.save(commuter);
            }

            String jwt = jwtUtils.generateToken(commuter.getUsername());
            response.addCookie(buildJwtCookie(jwt));

            return ResponseEntity.ok(new JwtResponse(
                    jwt,
                    commuter.getUsername(),
                    "ROLE_COMMUTER",
                    commuter.getVerifiedStatus()));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Google authentication failed."));
        }
    }

    // ── Register ──────────────────────────────────────────────────────────────
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody SignupRequest req,
            HttpServletResponse response) {

        if (commuterRepo.existsByUsername(req.getUsername()) ||
                driverRepo.existsByUsername(req.getUsername())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Username is already taken"));
        }

        String jwt;
        String role;
        String verifiedStatus;

        if ("driver".equalsIgnoreCase(req.getRole())) {
            if (req.getLicenseNo() == null || req.getPlateNo() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message",
                                "License and plate number are required for drivers"));
            }
            Driver driver = new Driver(
                    req.getUsername(), encoder.encode(req.getPassword()),
                    req.getFullName(), req.getPhone(), req.getEmail(),
                    req.getLicenseNo(), req.getPlateNo(), req.getTodaNo());
            driver.setVerifiedStatus("pending");
            if (req.getAge() != null)
                driver.setAge(req.getAge());
            if (req.getAddress() != null)
                driver.setAddress(req.getAddress());
            if (req.getProfilePhoto() != null)
                driver.setProfilePhoto(req.getProfilePhoto());
            if (req.getPhotoLicense() != null)
                driver.setPhotoLicense(req.getPhotoLicense());
            if (req.getPhotoPlate() != null)
                driver.setPhotoPlate(req.getPhotoPlate());
            if (req.getPhotoToda() != null)
                driver.setPhotoToda(req.getPhotoToda());
            driverRepo.save(driver);
            role = "ROLE_DRIVER";
            verifiedStatus = "pending";

        } else {
            Commuter commuter = new Commuter(
                    req.getUsername(), encoder.encode(req.getPassword()),
                    req.getFullName(), req.getPhone(), req.getEmail());
            commuter.setVerifiedStatus("verified");
            if (req.getAge() != null)
                commuter.setAge(req.getAge());
            if (req.getAddress() != null)
                commuter.setAddress(req.getAddress());
            if (req.getProfilePhoto() != null)
                commuter.setProfilePhoto(req.getProfilePhoto());
            commuterRepo.save(commuter);
            role = "ROLE_COMMUTER";
            verifiedStatus = "verified";
        }

        jwt = jwtUtils.generateToken(req.getUsername());
        response.addCookie(buildJwtCookie(jwt));
        return ResponseEntity.ok(Map.of(
                "token", jwt,
                "username", req.getUsername(),
                "role", role,
                "verifiedStatus", verifiedStatus));
    }

    // ── Forgot Password — Step 1: send OTP ───────────────────────────────────
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Email is required."));
        }

        // Explicit Optional types — avoids var inference issues
        Optional<Commuter> foundCommuter = commuterRepo.findByEmail(email);
        Optional<Driver> foundDriver = driverRepo.findByEmail(email);
        boolean exists = foundCommuter.isPresent() || foundDriver.isPresent();

        // Always return OK to avoid email enumeration attacks
        if (!exists) {
            return ResponseEntity.ok(
                    Map.of("message", "If that email is registered, you will receive an OTP."));
        }

        // Delete any previous tokens for this email
        resetTokenRepo.deleteAllByEmail(email);

        // Generate a 6-digit OTP, valid for 15 minutes
        String otp = String.format("%06d", new Random().nextInt(1_000_000));
        Instant expiresAt = Instant.now().plusSeconds(15 * 60);
        resetTokenRepo.save(new PasswordResetToken(email, otp, expiresAt));

        // Send email
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(fromEmail);
            msg.setTo(email);
            msg.setSubject("PasadaNow — Password Reset OTP");
            msg.setText(
                    "Your OTP for resetting your PasadaNow password is:\n\n"
                            + "  " + otp + "\n\n"
                            + "This code expires in 15 minutes. Do not share it with anyone.\n\n"
                            + "If you did not request a password reset, you can ignore this email.");
            mailSender.send(msg);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to send OTP email. Please try again."));
        }

        return ResponseEntity.ok(
                Map.of("message", "If that email is registered, you will receive an OTP."));
    }

    // ── Reset Password — Step 2: verify OTP + set new password ───────────────
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String otp = body.get("otp");
        String newPassword = body.get("newPassword");

        if (email == null || otp == null || newPassword == null
                || email.isBlank() || otp.isBlank() || newPassword.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Email, OTP, and new password are required."));
        }

        if (newPassword.length() < 6) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Password must be at least 6 characters."));
        }

        Optional<PasswordResetToken> tokenOpt = resetTokenRepo.findTopByEmailOrderByExpiresAtDesc(email);

        if (tokenOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "No OTP found for this email. Please request again."));
        }

        PasswordResetToken token = tokenOpt.get();

        if (token.isUsed()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "This OTP has already been used."));
        }

        if (Instant.now().isAfter(token.getExpiresAt())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "OTP has expired. Please request a new one."));
        }

        if (!token.getOtp().equals(otp)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Incorrect OTP. Please try again."));
        }

        // Mark token as used
        token.setUsed(true);
        resetTokenRepo.save(token);

        // Explicit Optional types — avoids var inference issues
        String encodedPassword = encoder.encode(newPassword);
        Optional<Commuter> commuter = commuterRepo.findByEmail(email);

        if (commuter.isPresent()) {
            commuter.get().setPassword(encodedPassword);
            commuterRepo.save(commuter.get());
        } else {
            Optional<Driver> driver = driverRepo.findByEmail(email);
            if (driver.isPresent()) {
                driver.get().setPassword(encodedPassword);
                driverRepo.save(driver.get());
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Account not found."));
            }
        }

        // Clean up used tokens
        resetTokenRepo.deleteAllByEmail(email);

        return ResponseEntity.ok(Map.of("message", "Password reset successfully."));
    }

    // ── Logout ────────────────────────────────────────────────────────────────
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        response.addCookie(expiredJwtCookie());
        return ResponseEntity.ok(Map.of("message", "Logged out"));
    }

    // ── Me ────────────────────────────────────────────────────────────────────
    @GetMapping("/me")
    public ResponseEntity<?> me() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()
                || auth.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String username = auth.getName();

        Optional<Commuter> commuter = commuterRepo.findByUsername(username);
        if (commuter.isPresent()) {
            return ResponseEntity.ok(Map.of(
                    "username", username,
                    "role", "ROLE_COMMUTER",
                    "verifiedStatus", commuter.get().getVerifiedStatus()));
        }

        Driver d = driverRepo.findByUsername(username).orElseThrow();
        return ResponseEntity.ok(Map.of(
                "username", username,
                "role", "ROLE_DRIVER",
                "verifiedStatus", d.getVerifiedStatus()));
    }
}