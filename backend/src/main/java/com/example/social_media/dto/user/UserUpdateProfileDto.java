package com.example.social_media.dto.user;

import java.time.LocalDate;

public class UserUpdateProfileDto {
    private String displayName;
    private String bio;
    private Short gender;
    private LocalDate dateOfBirth;
    private String profileImageUrl; // Thêm trường profileImageUrl
    private String phoneNumber;
    private String locationName; // Thêm trường locationName
    private Double latitude;    // Thêm trường latitude
    private Double longitude;

    public UserUpdateProfileDto() {}

    // Getters và setters
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public Short getGender() { return gender; }
    public void setGender(Short gender) { this.gender = gender; }

    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public String getProfileImageUrl() { return profileImageUrl; }
    public void setProfileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getLocationName() {
        return locationName;
    }

    public void setLocationName(String locationName) {
        this.locationName = locationName;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }
}