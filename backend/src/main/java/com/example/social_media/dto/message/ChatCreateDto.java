package com.example.social_media.dto.message;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ChatCreateDto {
    private Integer targetUserId;

    public Integer getTargetUserId() {
        return targetUserId;
    }

    public void setTargetUserId(Integer targetUserId) {
        this.targetUserId = targetUserId;
    }
}