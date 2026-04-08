package com.pasadanow.finalproject.dto;

public class JwtResponse {
    private String token;
    private Long id;
    private String type = "Bearer"; // Standard for JWT

    public JwtResponse(String accessToken) {
        this.token = accessToken;
    }

    // Getters and Setters
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
}