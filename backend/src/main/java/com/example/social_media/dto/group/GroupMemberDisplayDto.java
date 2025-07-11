package com.example.social_media.dto.group;

public class GroupMemberDisplayDto {
    private Integer id;
    private String displayName;
    private String username;
    private String avatarUrl;
    private boolean isAdmin;
    private boolean isOwner;

    public GroupMemberDisplayDto(
            Integer id,
            String displayName,
            String username,
            String avatarUrl,
            boolean isAdmin,
            boolean isOwner
    ) {
        this.id = id;
        this.displayName = displayName;
        this.username = username;
        this.avatarUrl = avatarUrl;
        this.isAdmin = isAdmin;
        this.isOwner = isOwner;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public boolean isAdmin() {
        return isAdmin;
    }

    public void setAdmin(boolean admin) {
        isAdmin = admin;
    }

    public boolean isOwner() {
        return isOwner;
    }

    public void setOwner(boolean owner) {
        isOwner = owner;
    }
}
