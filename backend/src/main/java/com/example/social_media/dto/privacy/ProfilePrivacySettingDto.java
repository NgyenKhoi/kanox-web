package com.example.social_media.dto.privacy;

public class ProfilePrivacySettingDto {
    private final String privacySetting;

    public ProfilePrivacySettingDto(String privacySetting) {
        this.privacySetting = privacySetting;
    }

    public String getPrivacySetting() {
        return privacySetting;
    }

}
