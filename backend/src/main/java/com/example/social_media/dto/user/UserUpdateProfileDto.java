package com.example.social_media.dto.user;

import java.time.LocalDate;

public class UserUpdateProfileDto {
    private String displayName;
    private String bio;
    private Short gender;
    private LocalDate dateOfBirth;

    public UserUpdateProfileDto() {
    }

    public UserUpdateProfileDto(String displayName, String bio, Short gender, LocalDate dateOfBirth) {
        this.displayName = displayName;
        this.bio = bio;
        this.gender = gender;
        this.dateOfBirth = dateOfBirth;
    }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public Short getGender() { return gender; }
    public void setGender(Short gender) { this.gender = gender; }

    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }

}
