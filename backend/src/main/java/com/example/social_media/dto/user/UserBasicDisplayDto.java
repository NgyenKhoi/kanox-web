package com.example.social_media.dto.user;

public class UserBasicDisplayDto {
    private Integer id;
    private String displayName;
    private String username;
    private String avatarUrl;

    public UserBasicDisplayDto(Integer id, String displayName, String username, String avatarUrl) {
        this.id = id;
        this.displayName = displayName;
        this.username = username;
        this.avatarUrl = avatarUrl;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
}
