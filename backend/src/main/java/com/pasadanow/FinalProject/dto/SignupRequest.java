package com.pasadanow.FinalProject.dto;

public class SignupRequest {
    private String username;
    private String password;
    private String fullName;
    private String age;
    private String phone;
    private String email;
    private String address;
    private String role;

    // driver fields
    private String licenseNo;
    private String plateNo;
    private String todaNo;

    // photo fields (base64)
    private String profilePhoto;
    private String photoLicense;
    private String photoPlate;
    private String photoToda;

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

    public String getRole() {
        return role;
    }

    public void setRole(String v) {
        this.role = v;
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
}