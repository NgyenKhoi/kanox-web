package com.example.social_media.dto.media;

public class MediaDto {
    private String url;
    private String type;
    private String targetType;
    private Boolean status;

    public MediaDto(String url, String type, String targetType, Boolean status) {
        this.url = url;
        this.type = type;
        this.targetType = targetType;
        this.status = status;
    }

    public MediaDto() {
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getTargetType() {
        return targetType;
    }

    public void setTargetType(String targetType) {
        this.targetType = targetType;
    }

    public Boolean getStatus() {
        return status;
    }

    public void setStatus(Boolean status) {
        this.status = status;
    }
}