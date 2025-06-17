package com.example.social_media.dto.message;

import java.time.Instant;

public class CallSessionDto {
    private Integer sessionId;
    private Integer chatId;
    private Integer hostId;
    private Instant startTime;
    private Instant endTime;

    public CallSessionDto(Integer sessionId, Integer chatId, Integer hostId, Instant startTime, Instant endTime) {
        this.sessionId = sessionId;
        this.chatId = chatId;
        this.hostId = hostId;
        this.startTime = startTime;
        this.endTime = endTime;
    }

    public Integer getSessionId() {
        return sessionId;
    }

    public void setSessionId(Integer sessionId) {
        this.sessionId = sessionId;
    }

    public Integer getChatId() {
        return chatId;
    }

    public void setChatId(Integer chatId) {
        this.chatId = chatId;
    }

    public Integer getHostId() {
        return hostId;
    }

    public void setHostId(Integer hostId) {
        this.hostId = hostId;
    }

    public Instant getStartTime() {
        return startTime;
    }

    public void setStartTime(Instant startTime) {
        this.startTime = startTime;
    }

    public Instant getEndTime() {
        return endTime;
    }

    public void setEndTime(Instant endTime) {
        this.endTime = endTime;
    }
}