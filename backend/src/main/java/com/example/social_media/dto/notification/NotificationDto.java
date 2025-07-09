package com.example.social_media.dto.notification;

import java.time.Instant;

public class NotificationDto {
    private Integer id;
    private String message;
    private String type;
    private Integer targetId;
    private String targetType;
    private String displayName;
    private String username;
    private Instant createdAt;
    private String status;
    private String image;

    public NotificationDto() {
    }

    public NotificationDto(Integer id, String message, String type, Integer targetId, String targetType,
            String displayName, String username, Instant createdAt, String status, String image) {
        this.id = id;
        this.message = message;
        this.type = type;
        this.targetId = targetId;
        this.targetType = targetType;
        this.displayName = displayName;
        this.username = username;
        this.createdAt = createdAt;
        this.status = status;
        this.image = image;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
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

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getUsername() { 
        return username;
    }

    public void setUsername(String username) { 
        this.username = username;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }
}
