package com.example.social_media.controller;
import com.example.social_media.config.URLConfig;
import com.example.social_media.dto.LoginRequestDto;
import com.example.social_media.dto.PasswordResetDto;
import com.example.social_media.dto.RegisterRequestDto;
import com.example.social_media.entity.User;
import com.example.social_media.jwt.JwtService;
import com.example.social_media.service.AuthService;
import com.example.social_media.service.PasswordResetService;
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
    public ResponseEntity<?> login(@RequestBody LoginRequestDto loginRequest) {
        Optional<User> userOpt = authService.loginFlexible(loginRequest.getIdentifier(), loginRequest.getPassword());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String token = jwtService.generateToken(user.getUsername());
            //print log check token exists
            logger.info("Generated JWT token for user {}: {}", user.getUsername(), token);

            Map<String, Object> result = new HashMap<>();
            result.put("token", token);
            result.put("user", user);
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.status(401).body("Invalid credentials");
    }

    @GetMapping(URLConfig.PROFILE)
    public ResponseEntity<?> getProfile(@PathVariable String username) {
        Optional<User> userOpt = authService.getProfileByUsername(username);
        return userOpt.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping(URLConfig.LOGOUT)
    public ResponseEntity<?> logout(@RequestParam Integer userId) {
        Optional<User> userOpt = authService.getProfile(userId);
        if (userOpt.isPresent()) {
            authService.logout(userOpt.get());
            return ResponseEntity.ok("Logged out successfully");
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping(URLConfig.FORGOT_PASSWORD)
    public ResponseEntity<?> forgotPassword(@RequestBody PasswordResetDto request) {
        if (request.getEmail() == null) {
            return ResponseEntity.badRequest().body("Email is required");
        }
        boolean result = authService.forgotPassword(request.getEmail());
        if (result) {
            return ResponseEntity.ok("Password reset instructions sent to email");
        } else {
            return ResponseEntity.status(404).body("Email not found");
        }
    }

    @PostMapping(URLConfig.RESET_PASSWORD)
    public ResponseEntity<?> resetPassword(@RequestBody PasswordResetDto request) {
        if (request.getToken() == null || request.getNewPassword() == null) {
            return ResponseEntity.badRequest().body("Token and newPassword are required");
        }
        try {
            passwordResetService.resetPassword(request.getToken(), request.getNewPassword());
            return ResponseEntity.ok("Đặt lại mật khẩu thành công.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Có lỗi xảy ra, vui lòng thử lại sau.");
        }
    }

    @PostMapping(URLConfig.REGISTER)
    public ResponseEntity<?> register(@RequestBody RegisterRequestDto dto) {
        try {
            User createdUser = authService.register(dto);
            return ResponseEntity.ok(createdUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Registration failed: " + e.getMessage());
        }
    }
}