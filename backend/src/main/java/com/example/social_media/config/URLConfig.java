package com.example.social_media.config;

public class URLConfig {
    // Authentication URLs
    public static final String AUTH_BASE = "/api/auth";
    public static final String LOGIN = "/login";
    public static final String REGISTER = "/register";
    public static final String FORGOT_PASSWORD = "/forgot-password";
    public static final String RESET_PASSWORD = "/reset-password";
    public static final String PROFILE = "/profile/{username}";
    public static final String LOGOUT = "/logout";

    // Frontend URLs
    public static final String FRONTEND_RESET_PASSWORD_URL = "https://kanox-web.netlify.app/reset-password?token=";

}
