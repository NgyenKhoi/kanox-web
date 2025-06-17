package com.example.social_media.dto.message;

import java.time.Instant;

public class MessageDto {
    private Integer id;
    private Integer chatId;
    private Integer senderId;
    private String content;
    private Integer typeId;
    private Instant createdAt;

    public MessageDto() {}

    public MessageDto(Integer id, Integer chatId, Integer senderId, String content, Integer typeId, Instant createdAt) {
        this.id = id;
        this.chatId = chatId;
        this.senderId = senderId;
        this.content = content;
        this.typeId = typeId;
        this.createdAt = createdAt;
    }

    // Getters and setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public Integer getChatId() { return chatId; }
    public void setChatId(Integer chatId) { this.chatId = chatId; }
    public Integer getSenderId() { return senderId; }
    public void setSenderId(Integer senderId) { this.senderId = senderId; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public Integer getTypeId() { return typeId; }
    public void setTypeId(Integer typeId) { this.typeId = typeId; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}