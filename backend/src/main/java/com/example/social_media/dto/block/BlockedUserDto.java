package com.example.social_media.dto.block;

public class BlockedUserDto {
    private Integer id;
    private String username;
    private String displayName;

    // Constructor
    public BlockedUserDto(Integer id, String username, String displayName) {
        this.id = id;
        this.username = username;
        this.displayName = displayName;
    }

    // Getters and Setters
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
}