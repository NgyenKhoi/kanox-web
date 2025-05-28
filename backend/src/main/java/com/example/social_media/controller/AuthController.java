package com.example.social_media.controller;

import com.example.social_media.config.URLConfig;
import com.example.social_media.dto.*;
import com.example.social_media.entity.User;
import com.example.social_media.jwt.JwtService;
import com.example.social_media.service.AuthService;
import com.example.social_media.service.PasswordResetService;
import jakarta.validation.Valid;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;

@RestController
@RequestMapping(URLConfig.AUTH_BASE)
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;
    private final JwtService jwtService;

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    public AuthController(AuthService authService, PasswordResetService passwordResetService, JwtService jwtService) {
        this.authService = authService;
        this.passwordResetService = passwordResetService;
        this.jwtService = jwtService;
    }

    @PostMapping(URLConfig.LOGIN)
    public ResponseEntity<?> login(@RequestBody @Valid LoginRequestDto loginRequest) {
        Optional<User> userOpt = authService.loginFlexible(loginRequest.getIdentifier(), loginRequest.getPassword());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String token = jwtService.generateToken(user.getUsername());
            logger.info("Generated JWT token for user {}: {}", user.getUsername(), token);

            Map<String, Object> result = new HashMap<>();
            result.put("token", token);
            result.put("user", user);
            return ResponseEntity.ok(result);
        }
        throw new IllegalArgumentException("Invalid credentials");
    }


    @PostMapping(URLConfig.LOGOUT)
    public ResponseEntity<?> logout(@RequestParam Integer userId) {
        Optional<User> userOpt = authService.getUser(userId);
        if (userOpt.isPresent()) {
            authService.logout(userOpt.get());
            return ResponseEntity.ok("Logged out successfully");
        }
        throw new IllegalArgumentException("User not found");
    }

    @PostMapping(URLConfig.FORGOT_PASSWORD)
<<<<<<< HEAD
    public ResponseEntity<?> forgotPassword(@RequestBody @Valid ForgotPasswordRequestDto request) {
=======
    public ResponseEntity<?> forgotPassword(@RequestBody PasswordResetDto request) {
>>>>>>> b5d23e5118633cb90a448b02e0366da479843be8
        if (request.getEmail() == null) {
            throw new IllegalArgumentException("Email is required");
        }
        boolean result = authService.forgotPassword(request.getEmail());
        if (result) {
            return ResponseEntity.ok("Password reset instructions sent to email");
        } else {
            throw new IllegalArgumentException("Email not found");
        }
    }

    @PostMapping(URLConfig.RESET_PASSWORD)
<<<<<<< HEAD
    public ResponseEntity<?> resetPassword(@RequestBody @Valid ResetPasswordRequestDto request) {
=======
    public ResponseEntity<?> resetPassword(@RequestBody PasswordResetDto request) {
>>>>>>> b5d23e5118633cb90a448b02e0366da479843be8
        if (request.getToken() == null || request.getNewPassword() == null) {
            throw new IllegalArgumentException("Token and newPassword are required");
        }
        try {
            passwordResetService.resetPassword(request.getToken(), request.getNewPassword());
            return ResponseEntity.ok("Đặt lại mật khẩu thành công.");
        } catch (IllegalArgumentException e) {
            throw e; // Let GlobalExceptionHandle handle it
        } catch (Exception e) {
            throw new RuntimeException("Có lỗi xảy ra, vui lòng thử lại sau.", e);
        }
    }

    @PostMapping(URLConfig.REGISTER)
    public ResponseEntity<?> register(@RequestBody @Valid RegisterRequestDto dto) {
        try {
            User createdUser = authService.register(dto);
            return ResponseEntity.ok(createdUser);
        } catch (Exception e) {
            throw new IllegalArgumentException("Registration failed: " + e.getMessage());
        }
    }
}