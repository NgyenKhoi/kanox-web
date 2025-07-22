package com.example.social_media.dto.user;

import java.time.LocalDate;

public class UserProfileDto {
    private Integer id;
    private String username;
    private String displayName;
    private String email;
    private String bio;
    private Short gender;
    private LocalDate dateOfBirth;
    private int followerCount;
    private int followeeCount;
    private String profileImageUrl;
    private int postCount;
    private String profilePrivacySetting;
    private String phoneNumber;
    private Double latitude;
    private Double longitude;
    private String locationName;

    public UserProfileDto() {}

    public UserProfileDto(Integer id, String username, String displayName, String email, String bio, Short gender, LocalDate dateOfBirth, int followerCount, int followeeCount, String profileImageUrl, int postCount, String profilePrivacySetting, String phoneNumber, Double latitude, Double longitude, String locationName) {
        this.id = id;
        this.username = username;
        this.displayName = displayName;
        this.email = email;
        this.bio = bio;
        this.gender = gender;
        this.dateOfBirth = dateOfBirth;
        this.followerCount = followerCount;
        this.followeeCount = followeeCount;
        this.profileImageUrl = profileImageUrl;
        this.postCount = postCount;
        this.profilePrivacySetting = profilePrivacySetting;
        this.phoneNumber = phoneNumber;
        this.latitude = latitude;
        this.longitude = longitude;
        this.locationName = locationName;
    }

    // Getters và setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public Short getGender() { return gender; }
    public void setGender(Short gender) { this.gender = gender; }

    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public int getFollowerCount() { return followerCount; }
    public void setFollowerCount(int followerCount) { this.followerCount = followerCount; }

    public int getFolloweeCount() { return followeeCount; }
    public void setFolloweeCount(int followeeCount) { this.followeeCount = followeeCount; }

    public String getProfileImageUrl() { return profileImageUrl; }
    public void setProfileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; }

    public int getPostCount() {
        return postCount;
    }

    public void setPostCount(int postCount) {
        this.postCount = postCount;
    }

    public String getProfilePrivacySetting() { return profilePrivacySetting; }
    public void setProfilePrivacySetting(String profilePrivacySetting) {
        this.profilePrivacySetting = profilePrivacySetting;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
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

    public String getLocationName() {
        return locationName;
    }

    public void setLocationName(String locationName) {
        this.locationName = locationName;
    }
}