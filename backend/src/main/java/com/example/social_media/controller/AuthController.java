package com.example.social_media.controller;
import com.example.social_media.entity.User;
import com.example.social_media.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    // Login
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestParam String identifier,
                                   @RequestParam String password,
                                   @RequestParam(defaultValue = "false") boolean rememberMe,
                                   HttpServletResponse response) {
        Optional<User> userOpt = authService.loginFlexible(identifier, password);
        if (userOpt.isPresent()) {
            User user = userOpt.get();

            if (rememberMe) {
                String token = authService.rememberMe(user);
                Cookie cookie = new Cookie("remember-me", token);
                cookie.setHttpOnly(true);
                cookie.setMaxAge(7 * 24 * 60 * 60); // 7 days
                cookie.setPath("/");
                response.addCookie(cookie);
            }

            return ResponseEntity.ok(user);
        }
        return ResponseEntity.status(401).body("Invalid credentials");
    }

    // Logout
    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestParam Integer userId) {
        Optional<User> userOpt = authService.getProfile(userId);
        if (userOpt.isPresent()) {
            authService.logout(userOpt.get());
            return ResponseEntity.ok("Logged out successfully");
        }
        return ResponseEntity.notFound().build();
    }

    // Login by persistent cookie
    @GetMapping("/login-by-cookie")
    public ResponseEntity<?> loginByCookie(@CookieValue(name = "remember-me", required = false) String cookie) {
        if (cookie == null) {
            return ResponseEntity.status(400).body("No remember-me cookie provided");
        }
        Optional<User> userOpt = authService.loginByPersistentCookie(cookie);
        if (userOpt.isPresent()) {
            return ResponseEntity.ok(userOpt.get());
        }
        return ResponseEntity.status(401).body("Invalid token");
    }

    // Forgot password
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestParam String email) {
        boolean result = authService.forgotPassword(email);
        if (result) {
            return ResponseEntity.ok("Password reset instructions sent to email");
        } else {
            return ResponseEntity.status(404).body("Email not found");
        }
    }

    // View profile
    @GetMapping("/profile/{username}")
    public ResponseEntity<?> getProfile(@PathVariable String username) {
        Optional<User> userOpt = authService.getProfileByUsername(username);
        return userOpt.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }
}