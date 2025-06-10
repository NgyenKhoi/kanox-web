package com.example.social_media.document;

import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;

import java.time.LocalDateTime;

@Document(indexName = "media")
public class MediaDocument {

    @Id
    private String id;

    private String mediaUrl;
    private String caption;
    private Integer mediaTypeId;
    private Integer targetTypeId;
    private Integer targetId;
    private Integer ownerId;
    private LocalDateTime createdAt;

    public MediaDocument() {
    }

    public MediaDocument(String id, String mediaUrl, String caption, Integer mediaTypeId, Integer targetTypeId, Integer targetId, Integer ownerId, LocalDateTime createdAt) {
        this.id = id;
        this.mediaUrl = mediaUrl;
        this.caption = caption;
        this.mediaTypeId = mediaTypeId;
        this.targetTypeId = targetTypeId;
        this.targetId = targetId;
        this.ownerId = ownerId;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getMediaUrl() {
        return mediaUrl;
    }

    public void setMediaUrl(String mediaUrl) {
        this.mediaUrl = mediaUrl;
    }

    public String getCaption() {
        return caption;
    }

    public void setCaption(String caption) {
        this.caption = caption;
    }

    public Integer getMediaTypeId() {
        return mediaTypeId;
    }

    public void setMediaTypeId(Integer mediaTypeId) {
        this.mediaTypeId = mediaTypeId;
    }

    public Integer getTargetTypeId() {
        return targetTypeId;
    }

    public void setTargetTypeId(Integer targetTypeId) {
        this.targetTypeId = targetTypeId;
    }

    public Integer getTargetId() {
        return targetId;
    }

    public void setTargetId(Integer targetId) {
        this.targetId = targetId;
    }

    public Integer getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(Integer ownerId) {
        this.ownerId = ownerId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
