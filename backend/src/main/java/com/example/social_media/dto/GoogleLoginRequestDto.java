package com.example.social_media.dto;

import com.example.social_media.entity.User;

public class GoogleLoginRequestDto {
    private String idToken;

    public String getIdToken() {
        return idToken;
    }

    public void setIdToken(String idToken) {
        this.idToken = idToken;
    }
}
