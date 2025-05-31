package com.example.social_media.controller;

import com.example.social_media.config.URLConfig;
import com.example.social_media.dto.*;
import com.example.social_media.entity.User;
import com.example.social_media.exception.EmailAlreadyExistsException;
import com.example.social_media.exception.InvalidTokenException;
import com.example.social_media.exception.TokenExpiredException;
import com.example.social_media.jwt.JwtService;
import com.example.social_media.service.AuthService;
import com.example.social_media.service.PasswordResetService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.time.LocalDate;
import java.time.DateTimeException;
import java.util.Optional;

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
        public ResponseEntity<?> forgotPassword (@RequestBody ForgotPasswordRequestDto request){
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
        public ResponseEntity<Map<String, Object>> resetPassword(@RequestBody @Valid ResetPasswordRequestDto request) {
            if (request.getToken() == null || request.getNewPassword() == null) {
                throw new IllegalArgumentException("Token and newPassword are required");
            }

            try {
                passwordResetService.resetPassword(request.getToken(), request.getNewPassword());
                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("message", "Đặt lại mật khẩu thành công.");
                return ResponseEntity.ok(response);
            } catch (InvalidTokenException e) {
                throw e;
            } catch (TokenExpiredException e) {
                throw e;
            } catch (Exception e) {
                logger.error("Unexpected error during password reset: ", e);
                throw new IllegalStateException("Không thể đặt lại mật khẩu: " + e.getMessage(), e);
            }
        }
            @PostMapping(URLConfig.REGISTER)
            public ResponseEntity<?> register(@RequestBody @Valid RegisterRequestDto dto) {
                logger.info("Received registration request for username: {}", dto.getUsername());
                try {
                    // Validate date of birth
                    try {
                        LocalDate.of(dto.getYear(), dto.getMonth(), dto.getDay());
                    } catch (DateTimeException e) {
                        logger.error("Invalid date of birth: {}-{}-{}", dto.getYear(), dto.getMonth(), dto.getDay());
                        return ResponseEntity.badRequest().body(Map.of(
                            "message", "Ngày sinh không hợp lệ",
                            "errors", Map.of("dob", "Ngày sinh không hợp lệ")
                        ));
                    }

                    User createdUser = authService.register(dto);
                    logger.info("User registered successfully with ID: {}", createdUser.getId());
                    return ResponseEntity.ok(Map.of(
                        "message", "Đăng ký thành công",
                        "user", createdUser
                    ));
                } catch (EmailAlreadyExistsException e) {
                    logger.warn("Registration failed: Email already exists - {}", dto.getEmail());
                    return ResponseEntity.badRequest().body(Map.of(
                        "message", e.getMessage(),
                        "errors", Map.of("email", e.getMessage())
                    ));
                } catch (Exception e) {
                    logger.error("Registration failed for username {}: {}", dto.getUsername(), e.getMessage(), e);
                    return ResponseEntity.badRequest().body(Map.of(
                        "message", "Đăng ký thất bại: " + e.getMessage()
                    ));
                }
            }
        }