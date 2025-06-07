package com.example.social_media.config;

public class URLConfig {
    // Authentication URLs
    public static final String AUTH_BASE = "/api/auth";
    public static final String LOGIN = "/login";
    public static final String REGISTER = "/register";
    public static final String VERIFY_TOKEN = "/verify-token";
    public static final String FORGOT_PASSWORD = "/forgot-password";
    public static final String RESET_PASSWORD = "/reset-password";
    public static final String LOGOUT = "/logout";
    public static final String LOGIN_GOOGLE = "/login-google";
    public static final String EMAIL_VERIFICATION = "https://kanox-web.netlify.app/verify-email?token=";
    public static final String ME = "/me";
    // User Management URLs
    public static final String USER_MANAGEMENT_BASE = "/api/user";
    public static final String PROFILE = "/profile/{username}";
    // Post Management URLs
    public static final String POST_BASE = "/api/posts";
    public static final String NEWSFEED = "/newsfeed";
    // Upload Management URLs
    public static final String UPLOAD_BASE = "/api/upload";
    // Chat URLs
    public static final String CHAT_MESSAGES = "/chat/{chatId}/messages";
    // Frontend URLs
    public static final String FRONTEND_RESET_PASSWORD_URL = "https://kanox-web.netlify.app/reset-password?token=";


    //some id config (ex: google...)
    public static final String GOOGLE_LOGIN_CLIENT_ID = "233866118973-t26ue94egg2v1reebqpe684kglf0bjej.apps.googleusercontent.com";
}
