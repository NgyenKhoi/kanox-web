package com.example.social_media.dto.group;

public class GroupCreateDto {
    private String ownerUsername;
    private String name;
    private String description;
    private String privacyLevel;

    public GroupCreateDto() {
    }

    public GroupCreateDto(String ownerUsername, String name, String description, String privacyLevel) {
        this.ownerUsername = ownerUsername;
        this.name = name;
        this.description = description;
        this.privacyLevel = privacyLevel;
    }

    public String getOwnerUsername() {
        return ownerUsername;
    }

    public void setOwnerUsername(String ownerUsername) {
        this.ownerUsername = ownerUsername;
    }

    public String getPrivacyLevel() {
        return privacyLevel;
    }

    public void setPrivacyLevel(String privacyLevel) {
        this.privacyLevel = privacyLevel;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
