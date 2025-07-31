package com.example.social_media.dto.user;

public class UserUpdatePrivacyDto {
    private String profilePrivacySetting;
    private Integer customListId;

    public String getProfilePrivacySetting() {
        return profilePrivacySetting;
    }

    public void setProfilePrivacySetting(String profilePrivacySetting) {
        this.profilePrivacySetting = profilePrivacySetting;
    }

    public Integer getCustomListId() { return customListId; }
    public void setCustomListId(Integer customListId) { this.customListId = customListId; }
}