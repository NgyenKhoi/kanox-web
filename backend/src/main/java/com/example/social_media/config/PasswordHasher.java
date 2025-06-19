package com.example.social_media.config;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
//this class is for generate hashed password for admin -> add to database
public class PasswordHasher {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String rawPassword = "Thaonguyen.0507";
        String encodedPassword = encoder.encode(rawPassword);
        System.out.println(encodedPassword);
    }
}