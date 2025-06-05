package com.example.social_media.dto.authentication;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class LoginRequestDto {
    @NotBlank(message = "Identifier không được để trống")
    @Pattern(regexp = "^[A-Za-z0-9+_.-]+@([A-Za-z0-9.-]+\\.[A-Za-z]{2,})|[A-Za-z0-9]+$",
            message = "Identifier phải là email hợp lệ hoặc username")
    private String identifier;

    @NotBlank(message = "Mật khẩu không được để trống")
    private String password;

    public LoginRequestDto() {
    }

    public String getIdentifier() {
        return identifier;
    }

    public void setIdentifier(String identifier) {
        this.identifier = identifier;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}