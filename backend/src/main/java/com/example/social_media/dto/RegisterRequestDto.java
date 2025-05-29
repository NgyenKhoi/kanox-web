package com.example.social_media.dto;

import jakarta.validation.constraints.*;

public class RegisterRequestDto {
    @NotBlank(message = "Username không được để trống")
    @Pattern(regexp = "^[A-Za-z0-9]+$",
            message = "Username chỉ được chứa chữ cái và số")
    private String username;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Pattern(regexp = "^(?=.*[A-Z])(?=.*[!@#$%^&*()_+=.])(?=.{8,}).*$",
            message = "Mật khẩu phải dài ít nhất 8 ký tự, chứa ít nhất 1 chữ cái in hoa và 1 ký tự đặc biệt (!@#$%^&*()_+=.)")
    private String password;

    private int day;
    private int month;
    private int year;

    @Size(max = 50, message = "Display name không được quá 50 ký tự")
    private String displayName;

    @Pattern(regexp = "^\\+?[0-9]{7,15}$", message = "Số điện thoại không hợp lệ")
    private String phoneNumber;

    @Size(max = 255, message = "Bio không được quá 255 ký tự")
    private String bio;

    @Pattern(regexp = "^(MALE|FEMALE|OTHER)$", message = "Gender phải là MALE, FEMALE hoặc OTHER")
    private Short gender;

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

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public Short getGender() {
        return gender;
    }

    public void setGender(Short gender) {
        this.gender = gender;
    }
}