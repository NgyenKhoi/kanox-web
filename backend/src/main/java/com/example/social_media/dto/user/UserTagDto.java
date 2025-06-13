package com.example.social_media.dto.user;

import com.example.social_media.entity.User;

public class UserTagDto {
    private Integer id;
    private String username;
    private String displayName;

    public UserTagDto() {}

    public UserTagDto(User user) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.displayName = user.getDisplayName();
    }

    public UserTagDto(Integer id, String username, String displayName) {
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
}