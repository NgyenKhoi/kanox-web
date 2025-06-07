package com.example.social_media.dto.post;


import java.util.List;

public class PostRequestDto {
    private String content;

    private String privacySetting = "public";

    private List<Integer> taggedUserIds;
    private Integer customListId;

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getPrivacySetting() { return privacySetting; }
    public void setPrivacySetting(String privacySetting) { this.privacySetting = privacySetting; }

    public List<Integer> getTaggedUserIds() { return taggedUserIds; }
    public void setTaggedUserIds(List<Integer> taggedUserIds) { this.taggedUserIds = taggedUserIds; }

    public Integer getCustomListId() { return customListId; }
    public void setCustomListId(Integer customListId) { this.customListId = customListId; }
}