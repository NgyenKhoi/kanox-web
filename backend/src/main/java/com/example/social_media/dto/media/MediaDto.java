package com.example.social_media.dto.media;

import java.io.Serializable;

public class MediaDto implements Serializable {
    private static final long serialVersionUID = 1L;
    private Integer id;
    private String url;
    private String type;
    private Integer targetId;
    private String targetType;
    private Boolean status;

    public MediaDto() {
    }

    public MediaDto(Integer id, String url, String type, Integer targetId, String targetType, Boolean status) {
        this.id = id;
        this.url = url;
        this.type = type;
        this.targetId = targetId;
        this.targetType = targetType;
        this.status = status;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
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

    public Integer getTargetId() {
        return targetId;
    }

    public void setTargetId(Integer targetId) {
        this.targetId = targetId;
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
