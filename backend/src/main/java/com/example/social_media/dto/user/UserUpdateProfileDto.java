package com.example.social_media.dto.user;

import java.time.LocalDate;

public class UserUpdateProfileDto {
    private String displayName;
    private String bio;
    private Short gender;
    private LocalDate dateOfBirth;
    private String profileImageUrl; // Thêm trường profileImageUrl
    private String phoneNumber;

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
}