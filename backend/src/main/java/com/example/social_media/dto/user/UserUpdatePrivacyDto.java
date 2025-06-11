package com.example.social_media.dto.user;

public class UserUpdatePrivacyDto {
    private String privacySetting;
    private Integer customListId;

    public String getPrivacySetting() { return privacySetting; }
    public void setPrivacySetting(String privacySetting) { this.privacySetting = privacySetting; }
    public Integer getCustomListId() { return customListId; }
    public void setCustomListId(Integer customListId) { this.customListId = customListId; }
}