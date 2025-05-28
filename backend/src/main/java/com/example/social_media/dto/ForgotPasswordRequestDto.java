package com.example.social_media.dto;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
public class ForgotPasswordRequestDto {
    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    // Getter & Setter
    public String getEmail() {
        return email;
    }
    public void setEmail(String email) {
        this.email = email;
    }
}
