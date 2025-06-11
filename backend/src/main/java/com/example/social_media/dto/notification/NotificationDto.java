package com.example.social_media.dto.notification;

import java.time.Instant;

public class NotificationDto {
    private Integer id;
    private String message;
    private String type;
    private Integer targetId;
    private String targetType;
    private Instant createdAt;
    private String status;

    public NotificationDto() {}

    public NotificationDto(Integer id, String message, String type, Integer targetId, String targetType, Instant createdAt, String status) {
        this.id = id;
        this.message = message;
        this.type = type;
        this.targetId = targetId;
        this.targetType = targetType;
        this.createdAt = createdAt;
        this.status = status;
    }

    // Getters and Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Integer getTargetId() { return targetId; }
    public void setTargetId(Integer targetId) { this.targetId = targetId; }
    public String getTargetType() { return targetType; }
    public void setTargetType(String targetType) { this.targetType = targetType; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}