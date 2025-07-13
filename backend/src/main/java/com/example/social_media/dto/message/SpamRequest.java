package com.example.social_media.dto.message;

public class SpamRequest {
    private Integer chatId;
    private Integer targetUserId;

    // Getters and setters
    public Integer getChatId() {
        return chatId;
    }

    public void setChatId(Integer chatId) {
        this.chatId = chatId;
    }

    public Integer getTargetUserId() {
        return targetUserId;
    }

    public void setTargetUserId(Integer targetUserId) {
        this.targetUserId = targetUserId;
    }
}