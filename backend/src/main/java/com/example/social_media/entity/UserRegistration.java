package com.example.social_media.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "tblUserRegistration", schema = "dbo")
public class UserRegistration {

    @Id
    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "registration_time", nullable = false)
    private LocalDateTime registrationTime;

    @Column(name = "status", nullable = false)
    private Boolean status;

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public LocalDateTime getRegistrationTime() {
        return registrationTime;
    }

    public void setRegistrationTime(LocalDateTime registrationTime) {
        this.registrationTime = registrationTime;
    }

    public Boolean getStatus() {
        return status;
    }

    public void setStatus(Boolean status) {
        this.status = status;
    }
}