package com.example.social_media.controller;

import com.example.social_media.config.URLConfig;
import com.example.social_media.dto.authentication.*;
import com.example.social_media.dto.user.UserDto;
import com.example.social_media.entity.User;
import com.example.social_media.exception.EmailAlreadyExistsException;
import com.example.social_media.exception.InvalidTokenException;
import com.example.social_media.exception.TokenExpiredException;
import com.example.social_media.jwt.JwtService;
import com.example.social_media.service.AuthService;
import com.example.social_media.service.MailService;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import com.google.api.client.json.gson.GsonFactory;
import java.util.Map;
import java.time.LocalDate;
import java.time.DateTimeException;
import java.util.Optional;

@RestController
@RequestMapping(URLConfig.AUTH_BASE)
public class AuthController {

    private final AuthService authService;
    private final MailService mailService;
    private final JwtService jwtService;
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    public AuthController(AuthService authService,
                          MailService mailService,
                          JwtService jwtService
                          ) {
        this.authService = authService;
        this.mailService = mailService;
        this.jwtService = jwtService;
    }
    //GET CURRENT USER
    @GetMapping(URLConfig.ME)
    public ResponseEntity<?> getCurrentUser(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("message", "Missing or invalid Authorization header"));
        }

        String token = authHeader.substring(7); // bỏ "Bearer "
        String username;

        try {
            username = jwtService.extractUsername(token);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid token"));
        }

        Optional<User> userOpt = authService.getUserByUsername(username);
        if (userOpt.isPresent()) {
            return ResponseEntity.ok(new UserDto(userOpt.get()));
        } else {
            return ResponseEntity.status(404).body(Map.of("message", "User not found"));
        }
    }
    //LOGIN
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

    //LOGOUT
    @PostMapping(URLConfig.LOGOUT)
    public ResponseEntity<?> logout(@RequestParam Integer userId) {
        Optional<User> userOpt = authService.getUser(userId);
        if (userOpt.isPresent()) {
            authService.logout(userOpt.get());
            return ResponseEntity.ok("Logged out successfully");
        }
        throw new IllegalArgumentException("User not found");
    }
    //FORGOT PASSWORD
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
                mailService.resetPassword(request.getToken(), request.getNewPassword());
                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("message", "Đặt lại mật khẩu thành công.");
                return ResponseEntity.ok(response);
            } catch (InvalidTokenException | TokenExpiredException e) {
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
            try {
                LocalDate.of(dto.getYear(), dto.getMonth(), dto.getDay());
            } catch (DateTimeException e) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "Ngày sinh không hợp lệ",
                        "errors", Map.of("dob", "Ngày sinh không hợp lệ")
                ));
            }

            User createdUser = authService.register(dto);
            if (createdUser == null) {
                return ResponseEntity.ok(Map.of(
                        "message", "Đăng ký thành công, vui lòng kiểm tra email để xác thực tài khoản."
                ));
            }

            logger.info("User registered successfully with ID: {}", createdUser.getId());

            return ResponseEntity.ok(Map.of(
                    "message", "Đăng ký thành công, vui lòng kiểm tra email để xác thực tài khoản.",
                    "user", new UserDto(createdUser)
            ));
        } catch (EmailAlreadyExistsException e) {
            logger.warn("Email already exists: {}", dto.getEmail());
            return ResponseEntity.status(409).body(Map.of(
                    "message", e.getMessage()
            ));
        } catch (IllegalArgumentException e) {
            logger.warn("Registration failed due to illegal argument: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            logger.error("Unexpected error during registration: ", e);
            return ResponseEntity.status(500).body(Map.of(
                    "message", "Lỗi server, vui lòng thử lại sau."
            ));
        }
    }

    // Endpoint xác thực token
    @PostMapping(URLConfig.VERIFY_TOKEN)
    public ResponseEntity<?> verifyToken(@RequestParam String token) {
        try {
            User verifiedUser = authService.verifyToken(token);
            logger.info("User {} verified successfully", verifiedUser.getUsername());

            return ResponseEntity.ok(Map.of(
                    "message", "Tài khoản đã được xác thực thành công.",
                    "user", new UserDto(verifiedUser)
            ));
        } catch (IllegalArgumentException e) {
            logger.warn("Token verification failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            logger.error("Unexpected error during token verification: ", e);
            return ResponseEntity.status(500).body(Map.of(
                    "message", "Lỗi máy chủ khi xác thực token."
            ));
        }
    }

    //add login google here
    @PostMapping(URLConfig.LOGIN_GOOGLE)
    public ResponseEntity<?> loginWithGoogleIdToken(@RequestBody GoogleLoginRequestDto request) {
        try {
            logger.info("Received Google login request with idToken: {}", request.getIdToken());
            if (request.getIdToken() == null || request.getIdToken().isEmpty()) {
                logger.warn("idToken is null or empty");
                return ResponseEntity.badRequest().body(Map.of("error", "idToken is required"));
            }

            // Xác minh idToken
            logger.info("Verifying idToken with clientId: {}", URLConfig.GOOGLE_LOGIN_CLIENT_ID);
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                    .setAudience(List.of(URLConfig.GOOGLE_LOGIN_CLIENT_ID))
                    .build();

            GoogleIdToken idToken = verifier.verify(request.getIdToken());
            if (idToken == null) {
                logger.warn("Invalid ID token");
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid ID token"));
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String googleId = payload.getSubject();
            logger.info("Google payload - email: {}, name: {}, googleId: {}", email, name, googleId);

            logger.info("Calling loginOrRegisterGoogleUser for email: {}", email);
            User user = authService.loginOrRegisterGoogleUser(googleId, email, name);
            logger.info("User retrieved/created: {}", user.getUsername());

            String token = jwtService.generateToken(user.getUsername());
            logger.info("Generated JWT token for user: {}", user.getUsername());

            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "user", new UserDto(user)
            ));

        } catch (IllegalStateException e) {
            logger.error("Illegal state during Google login: {}", e.getMessage());
            if (e.getMessage().contains("Email đã tồn tại") ||
                    e.getMessage().contains("Username đã tồn tại") ||
                    e.getMessage().contains("Email đã được liên kết")) {
                return ResponseEntity.status(409).body(Map.of("error", e.getMessage()));
            }
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error in Google login: ", e);
            return ResponseEntity.status(500).body(Map.of("error", "Google login failed: " + e.getMessage()));
        }
    }
}