package com.example.social_media.dto.notification;

import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.Instant;

public class NotificationDto {
    private Integer id;
    private String message;
    private String type;
    @JsonIgnore
    private String username;
    private Integer targetId;
    private String targetType;
    private String displayName;
    private Instant createdAt;
    private String status;

    public NotificationDto() {}

    public NotificationDto(Integer id, String message, String type, Integer targetId, String targetType, String displayName, Instant createdAt, String status) {
        this.id = id;
        this.message = message;
        this.type = type;
        this.targetId = targetId;
        this.targetType = targetType;
        this.createdAt = createdAt;
        this.status = status;
        this.displayName = displayName;
    }

    // Getters and Setters

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

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }
}