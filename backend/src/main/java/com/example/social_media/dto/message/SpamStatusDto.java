package com.example.social_media.dto.message;

public class SpamStatusDto {
    private Integer chatId;
    private boolean isSpam;

    public SpamStatusDto(Integer chatId, boolean isSpam) {
        this.chatId = chatId;
        this.isSpam = isSpam;
    }

    // Getters and setters
    public Integer getChatId() {
        return chatId;
    }

    public void setChatId(Integer chatId) {
        this.chatId = chatId;
    }

    public boolean getIsSpam() {
        return isSpam;
    }

    public void setIsSpam(boolean isSpam) {
        this.isSpam = isSpam;
    }
}