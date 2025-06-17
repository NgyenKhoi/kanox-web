package com.example.social_media.dto.message;

public class SignalMessageDto {
    private Integer chatId;
    private String type;
    private String sdp;
    private String candidate;
    private Integer userId;

    public SignalMessageDto() {}

    public SignalMessageDto(Integer chatId, String type, String sdp, String candidate, Integer userId) {
        this.chatId = chatId;
        this.type = type;
        this.sdp = sdp;
        this.candidate = candidate;
        this.userId = userId;
    }

    public Integer getChatId() { return chatId; }
    public void setChatId(Integer chatId) { this.chatId = chatId; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getSdp() { return sdp; }
    public void setSdp(String sdp) { this.sdp = sdp; }
    public String getCandidate() { return candidate; }
    public void setCandidate(String candidate) { this.candidate = candidate; }
    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }
}