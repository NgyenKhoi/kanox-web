package com.example.social_media.dto.message;

import java.time.Instant;

public class MessageDto {
    private Long id;
    private Long chatId;
    private Long senderId;
    private String content;
    private Integer typeId;
    private Instant createdAt;

    public MessageDto() {}

    public MessageDto(Long id, Long chatId, Long senderId, String content, Integer typeId, Instant createdAt) {
        this.id = id;
        this.chatId = chatId;
        this.senderId = senderId;
        this.content = content;
        this.typeId = typeId;
        this.createdAt = createdAt;
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getChatId() { return chatId; }
    public void setChatId(Long chatId) { this.chatId = chatId; }
    public Long getSenderId() { return senderId; }
    public void setSenderId(Long senderId) { this.senderId = senderId; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public Integer getTypeId() { return typeId; }
    public void setTypeId(Integer typeId) { this.typeId = typeId; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}