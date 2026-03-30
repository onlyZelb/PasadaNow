package com.pasadanow.finalproject.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;
    private String password;
    private String role;

    // ── new profile fields ──────────────────
    private String fullName;
    private String phone;
    private String email;

    // driver-only fields
    private String licenseNo;
    private String plateNo;
    private String todaNo;

    public User() {}

    // Original constructor (keeps existing code happy)
    public User(String username, String password, String role) {
        this.username = username;
        this.password = password;
        this.role     = role;
    }

    // Full constructor used by register endpoint
    public User(String username, String password, String role,
                String fullName, String phone, String email,
                String licenseNo, String plateNo, String todaNo) {
        this.username  = username;
        this.password  = password;
        this.role      = role;
        this.fullName  = fullName;
        this.phone     = phone;
        this.email     = email;
        this.licenseNo = licenseNo;
        this.plateNo   = plateNo;
        this.todaNo    = todaNo;
    }

    // ── getters & setters ───────────────────

    public Long getId()                  { return id; }
    public void setId(Long id)           { this.id = id; }

    public String getUsername()          { return username; }
    public void setUsername(String v)    { this.username = v; }

    public String getPassword()          { return password; }
    public void setPassword(String v)    { this.password = v; }

    public String getRole()              { return role; }
    public void setRole(String v)        { this.role = v; }

    public String getFullName()          { return fullName; }
    public void setFullName(String v)    { this.fullName = v; }

    public String getPhone()             { return phone; }
    public void setPhone(String v)       { this.phone = v; }

    public String getEmail()             { return email; }
    public void setEmail(String v)       { this.email = v; }

    public String getLicenseNo()         { return licenseNo; }
    public void setLicenseNo(String v)   { this.licenseNo = v; }

    public String getPlateNo()           { return plateNo; }
    public void setPlateNo(String v)     { this.plateNo = v; }

    public String getTodaNo()            { return todaNo; }
    public void setTodaNo(String v)      { this.todaNo = v; }
}