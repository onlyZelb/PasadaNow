package com.pasadanow.finalproject.dto;

public class SignupRequest {

    private String username;
    private String password;

    // "commuter" or "driver" — sent from the React form
    private String role;

    // shared profile fields
    private String fullName;
    private String phone;
    private String email;

    // driver-only fields
    private String licenseNo;
    private String plateNo;
    private String todaNo;

    // ── getters & setters ───────────────────

    public String getUsername()         { return username; }
    public void setUsername(String v)   { this.username = v; }

    public String getPassword()         { return password; }
    public void setPassword(String v)   { this.password = v; }

    public String getRole()             { return role; }
    public void setRole(String v)       { this.role = v; }

    public String getFullName()         { return fullName; }
    public void setFullName(String v)   { this.fullName = v; }

    public String getPhone()            { return phone; }
    public void setPhone(String v)      { this.phone = v; }

    public String getEmail()            { return email; }
    public void setEmail(String v)      { this.email = v; }

    public String getLicenseNo()        { return licenseNo; }
    public void setLicenseNo(String v)  { this.licenseNo = v; }

    public String getPlateNo()          { return plateNo; }
    public void setPlateNo(String v)    { this.plateNo = v; }

    public String getTodaNo()           { return todaNo; }
    public void setTodaNo(String v)     { this.todaNo = v; }
}