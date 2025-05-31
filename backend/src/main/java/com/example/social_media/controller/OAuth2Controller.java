package com.example.social_media.controller;

import com.example.social_media.entity.User;
import com.example.social_media.jwt.JwtService;
import com.example.social_media.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.view.RedirectView;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
public class OAuth2Controller {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    @GetMapping("/")
    public RedirectView home() {
        return new RedirectView("/auth");
    }

    @GetMapping("/auth")
    public String auth() {
        return "auth";
    }

    @GetMapping("/auth/login")
    public String login() {
        return "login";
    }

    @GetMapping("/auth/success")
    public Map<String, Object> authSuccess(@AuthenticationPrincipal OAuth2User principal) {
        Map<String, Object> response = new HashMap<>();
        
        if (principal != null) {
            String email = principal.getAttribute("email");
            String name = principal.getAttribute("name");
            String googleId = principal.getAttribute("sub");

            // Kiểm tra xem người dùng đã tồn tại chưa
            Optional<User> existingUser = userRepository.findByGoogleId(googleId);
            User user;

            if (existingUser.isPresent()) {
                user = existingUser.get();
            } else {
                // Tạo người dùng mới nếu chưa tồn tại
                user = new User();
                user.setEmail(email);
                user.setUsername(email.split("@")[0]); // Tạo username từ email
                user.setDisplayName(name);
                user.setGoogleId(googleId);
                user.setStatus(true);
                user = userRepository.save(user);
            }

            // Tạo JWT token
            String token = jwtService.generateToken(user.getUsername());
            
            response.put("token", token);
            response.put("user", user);
            return response;
        }
        
        response.put("error", "Authentication failed!");
        return response;
    }
} 