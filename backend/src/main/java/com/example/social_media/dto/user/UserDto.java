package com.example.social_media.dto.user;

import com.example.social_media.entity.User;

public class UserDto {
    private Integer id;
    private String username;
    private String displayName;
    private Short gender;
    private String bio;

    public UserDto() {}

    public UserDto(Integer id, String username, String displayName, Short gender, String bio) {
        this.id = id;
        this.username = username;
        this.displayName = displayName;
        this.gender = gender;
        this.bio = bio;
    }

    public UserDto(com.example.social_media.entity.User user) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.displayName = user.getDisplayName();
        this.gender = user.getGender();
        this.bio = user.getBio();
    }

    public UserDto(Integer id, String username, String displayName) {
        this.id = id;
        this.username = username;
        this.displayName = displayName;
    }

    // Getters and setters

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public Short getGender() {
        return gender;
    }

    public void setGender(Short gender) {
        this.gender = gender;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }
}

