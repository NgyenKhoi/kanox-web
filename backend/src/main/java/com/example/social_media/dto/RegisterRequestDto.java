package com.example.social_media.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

public class RegisterRequestDto {
    @NotBlank(message = "Username không được để trống")
    @Pattern(regexp = "^[A-Za-z0-9]+$",
            message = "Username chỉ được chứa chữ cái và số")
    private String username;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Pattern(regexp = "^(?=.*[A-Z])(?=.*[!@#$%^&*()_+=])(?=.{8,}).*$",
            message = "Mật khẩu phải dài ít nhất 8 ký tự, chứa ít nhất 1 chữ cái in hoa và 1 ký tự đặc biệt (!@#$%^&*()_+=)")
    private String password;

    @Min(value = 1, message = "Ngày phải từ 1 đến 31")
    @Max(value = 31, message = "Ngày phải từ 1 đến 31")
    private int day;

    @Min(value = 1, message = "Tháng phải từ 1 đến 12")
    @Max(value = 12, message = "Tháng phải từ 1 đến 12")
    private int month;

    @Min(value = 1900, message = "Năm phải từ 1900 trở lên")
    @Max(value = 2025, message = "Năm không được lớn hơn 2025")
    private int year;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public int getDay() {
        return day;
    }

    public void setDay(int day) {
        this.day = day;
    }

    public int getMonth() {
        return month;
    }

    public void setMonth(int month) {
        this.month = month;
    }

    public int getYear() {
        return year;
    }

    public void setYear(int year) {
        this.year = year;
    }
}