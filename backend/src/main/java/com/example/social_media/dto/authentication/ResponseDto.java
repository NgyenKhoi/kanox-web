package com.example.social_media.dto.authentication;

import com.example.social_media.entity.User;

public class ResponseDto {
    private String message;
    private String token;
    private User user;

    public ResponseDto(String message, String token, User user) {
        this.message = message;
        this.token = token;
        this.user = user;
    }

    // Getters and setters
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}
