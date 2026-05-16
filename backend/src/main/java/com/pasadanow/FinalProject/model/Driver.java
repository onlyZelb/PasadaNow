package com.pasadanow.FinalProject.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "drivers")
public class Driver {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, length = 255)
    private String password;

    @Column(name = "full_name", length = 100)
    private String fullName;

    @Column(length = 10)
    private String age;

    @Column(length = 20)
    private String phone;

    @Column(length = 100)
    private String email;

    @Column(length = 255)
    private String address;

    @Column(name = "license_no", nullable = false, length = 50)
    private String licenseNo;

    @Column(name = "plate_no", nullable = false, length = 30)
    private String plateNo;

    @Column(name = "toda_no", length = 50)
    private String todaNo;

    @Column(name = "profile_photo", columnDefinition = "TEXT")
    private String profilePhoto;

    @Column(name = "photo_license", columnDefinition = "TEXT")
    private String photoLicense;

    @Column(name = "photo_plate", columnDefinition = "TEXT")
    private String photoPlate;

    @Column(name = "photo_toda", columnDefinition = "TEXT")
    private String photoToda;

    @Column(name = "is_online")
    private Boolean isOnline = false;

    @Column(name = "last_lat")
    private Double lastLat;

    @Column(name = "last_lng")
    private Double lastLng;

    @Column(name = "verified_status", length = 20)
    private String verifiedStatus = "pending";

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    public Driver() {
    }

    public Driver(String username, String password, String fullName,
            String phone, String email,
            String licenseNo, String plateNo, String todaNo) {
        this.username = username;
        this.password = password;
        this.fullName = fullName;
        this.phone = phone;
        this.email = email;
        this.licenseNo = licenseNo;
        this.plateNo = plateNo;
        this.todaNo = todaNo;
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String v) {
        this.username = v;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String v) {
        this.password = v;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String v) {
        this.fullName = v;
    }

    public String getAge() {
        return age;
    }

    public void setAge(String v) {
        this.age = v;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String v) {
        this.phone = v;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String v) {
        this.email = v;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String v) {
        this.address = v;
    }

    public String getLicenseNo() {
        return licenseNo;
    }

    public void setLicenseNo(String v) {
        this.licenseNo = v;
    }

    public String getPlateNo() {
        return plateNo;
    }

    public void setPlateNo(String v) {
        this.plateNo = v;
    }

    public String getTodaNo() {
        return todaNo;
    }

    public void setTodaNo(String v) {
        this.todaNo = v;
    }

    public String getProfilePhoto() {
        return profilePhoto;
    }

    public void setProfilePhoto(String v) {
        this.profilePhoto = v;
    }

    public String getPhotoLicense() {
        return photoLicense;
    }

    public void setPhotoLicense(String v) {
        this.photoLicense = v;
    }

    public String getPhotoPlate() {
        return photoPlate;
    }

    public void setPhotoPlate(String v) {
        this.photoPlate = v;
    }

    public String getPhotoToda() {
        return photoToda;
    }

    public void setPhotoToda(String v) {
        this.photoToda = v;
    }

    public Boolean getIsOnline() {
        return isOnline;
    }

    public void setIsOnline(Boolean v) {
        this.isOnline = v;
    }

    public Double getLastLat() {
        return lastLat;
    }

    public void setLastLat(Double v) {
        this.lastLat = v;
    }

    public Double getLastLng() {
        return lastLng;
    }

    public void setLastLng(Double v) {
        this.lastLng = v;
    }

    public String getVerifiedStatus() {
        return verifiedStatus;
    }

    public void setVerifiedStatus(String v) {
        this.verifiedStatus = v;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant v) {
        this.updatedAt = v;
    }
}