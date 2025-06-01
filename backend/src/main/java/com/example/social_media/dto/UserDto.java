package com.example.social_media.dto;

import com.example.social_media.entity.User;

public class UserDto {
    private String username;
    private String displayName;
    private String email;

    public UserDto(User user) {
        this.username = user.getUsername();
        this.displayName = user.getDisplayName();
        this.email = user.getEmail();
    }


}
