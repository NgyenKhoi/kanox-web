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
    private String profileImageUrl; // Thêm trường cho URL ảnh đại diện

    // Constructors
    public UserProfileDto() {}

    public UserProfileDto(Integer id, String username, String displayName, String email, String bio, Short gender,
                          LocalDate dateOfBirth, int followerCount, int followeeCount, String profileImageUrl) {
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
}