package com.pasadanow.FinalProject.dto;

public class JwtResponse {
    private String token;
    private String username;
    private String role;
    private String verifiedStatus;

    public JwtResponse(String token, String username,
            String role, String verifiedStatus) {
        this.token = token;
        this.username = username;
        this.role = role;
        this.verifiedStatus = verifiedStatus;
    }

    public String getToken() {
        return token;
    }

    public String getUsername() {
        return username;
    }

    public String getRole() {
        return role;
    }

    public String getVerifiedStatus() {
        return verifiedStatus;
    }
}