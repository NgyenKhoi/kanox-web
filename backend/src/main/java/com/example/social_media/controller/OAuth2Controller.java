package com.example.social_media.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.view.RedirectView;

@RestController
public class OAuth2Controller {

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
    public String authSuccess(@AuthenticationPrincipal OAuth2User principal) {
        if (principal != null) {
            String email = principal.getAttribute("email");
            String name = principal.getAttribute("name");
            return "Welcome " + name + " (" + email + ")";
        }
        return "Authentication failed!";
    }
} 