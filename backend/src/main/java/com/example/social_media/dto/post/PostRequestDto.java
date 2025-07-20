package com.example.social_media.dto.post;


import com.example.social_media.entity.CustomPrivacyList;

import java.util.List;

public class PostRequestDto {
    private String content;

    private String privacySetting = "public";

    private List<Integer> taggedUserIds;
    private Integer customListId;
    private Integer groupId;
    private Double latitude;
    private Double longitude;
    private String locationName;

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getPrivacySetting() { return privacySetting; }
    public void setPrivacySetting(String privacySetting) { this.privacySetting = privacySetting; }

    public List<Integer> getTaggedUserIds() { return taggedUserIds; }
    public void setTaggedUserIds(List<Integer> taggedUserIds) { this.taggedUserIds = taggedUserIds; }

    public Integer getCustomListId() {
        return customListId;
    }

    public void setCustomListId(Integer customListId) {
        this.customListId = customListId;
    }

    public Integer getGroupId() {
        return groupId;
    }

    public void setGroupId(Integer groupId) {
        this.groupId = groupId;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public String getLocationName() {
        return locationName;
    }

    public void setLocationName(String locationName) {
        this.locationName = locationName;
    }
}