package com.example.social_media.dto.post;


import com.example.social_media.entity.CustomPrivacyList;

import java.util.List;

public class PostRequestDto {
    private String content;

    private String privacySetting = "public";

    private List<Integer> taggedUserIds;
    private CustomPrivacyList customList;

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getPrivacySetting() { return privacySetting; }
    public void setPrivacySetting(String privacySetting) { this.privacySetting = privacySetting; }

    public List<Integer> getTaggedUserIds() { return taggedUserIds; }
    public void setTaggedUserIds(List<Integer> taggedUserIds) { this.taggedUserIds = taggedUserIds; }

    public CustomPrivacyList getCustomList() {
        return customList;
    }

    public void setCustomListId(CustomPrivacyList customList) {
        this.customList = customList;
    }
}