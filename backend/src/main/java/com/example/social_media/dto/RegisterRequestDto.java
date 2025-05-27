package com.example.social_media.dto;

public class RegisterRequestDto {
    private String username;
    private String email;
    private String password;
    private Integer month;
    private Integer day;
    private Integer year;

    // Getters và Setters
    public String getUsername() { return username; }
    public void setUsername(String name) { this.username = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Integer getMonth() { return month; }
    public void setMonth(Integer month) { this.month = month; }

    public Integer getDay() { return day; }
    public void setDay(Integer day) { this.day = day; }

    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}