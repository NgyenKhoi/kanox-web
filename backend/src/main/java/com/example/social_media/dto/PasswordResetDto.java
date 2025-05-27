package com.example.social_media.dto;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class PasswordResetDto {
    private String email;
    private String token;
    private String newPassword;
}
