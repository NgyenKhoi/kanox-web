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
    public static final String REFRESH_TOKEN = "/refresh-token";
    public static final String CHECK_TOKEN = "/check-token";
    // User Management URLs
    public static final String USER_MANAGEMENT_BASE = "/api/user";
    public static final String PROFILE = "/profile/{username}";
    // Post Management URLs
    public static final String POST_BASE = "/api/posts";
    public static final String NEWSFEED = "/newsfeed";
    public static final String USER_POST = "/user/{username}";
    // Upload Management URLs
    public static final String UPLOAD_BASE = "/api/upload";
    // Chat URLs
    public static final String CHAT_BASE = "/api/chat";
    public static final String SEND_MESSAGES = "/sendMessage";
    public static final String GET_CHAT_MESSAGES = "/{chatId}/messages";
    public static final String CHATS = "/chats";
    public static final String CHAT_CREATE = "/create";
    public static final String CALL_START = "/call/start/{chatId}";
    public static final String MESSAGE_DELETE = "/message/delete";
    public static final String CALL_END = "/call/end/{callSessionId}";
    public static final String UNREAD_MESSAGE_COUNT = "/messages/unread-count";
    public static final String WEBSOCKET_CALL_OFFER = "/call/offer";
    public static final String WEBSOCKET_CALL_ANSWER = "/call/answer";
    // Frontend URLs
    public static final String FRONTEND_RESET_PASSWORD_URL = "https://kanox-web.netlify.app/reset-password?token=";

    //Search URLs
    public static final String SEARCH_BASE = "/api/search";
    public static final String SEARCH_USER = "/users";
    public static final String SEARCH_GROUP = "/groups";
    public static final String SEARCH_PAGE = "/pages";
    public static final String SEARCH_ALL = "/all";
    public static final String SEARCH_SYNC = "/sync";

    public static final String GOOGLE_LOGIN_CLIENT_ID = "233866118973-t26ue94egg2v1reebqpe684kglf0bjej.apps.googleusercontent.com";

    // Friendship URLs
    public static final String FRIENDSHIP_BASE = "/api/friends";
    public static final String SEND_FRIEND_REQUEST = "/request/{receiverId}";
    public static final String ACCEPT_FRIEND_REQUEST = "/accept/{requesterId}";
    public static final String REJECT_FRIEND_REQUEST = "/reject/{requesterId}";
    public static final String CANCEL_FRIENDSHIP = "/{friendId}";
    public static final String GET_FRIENDS = "/users/{userId}/friends";
    public static final String GET_FRIENDSHIP_STATUS = "/status/{targetId}";
    public static final String GET_RECEIVED_PENDING_REQUESTS = "/users/{userId}/received-pending";
    public static final String GET_SENT_PENDING_REQUESTS = "/users/{userId}/sent-pending";
    // Follow URLs
    public static final String FOLLOW_BASE = "/api/follows";
    public static final String FOLLOW_USER = "/{followeeId}";
    public static final String UNFOLLOW_USER = "/{followeeId}";
    public static final String GET_FOLLOWING = "/users/{userId}/following";
    public static final String GET_FOLLOWERS = "/users/{userId}/followers";
    public static final String GET_FOLLOW_STATUS = "/status/{targetId}";
    // Notifications
    public static final String NOTIFICATION_BASE = "/api/notifications";
    public static final String MARK_READ = "/{id}/mark-read";
    public static final String MARK_UNREAD = "/{id}/mark-unread";
    // Privacy URLs
    public static final String PRIVACY_BASE = "/api/privacy";
    public static final String CREATE_CUSTOM_LIST = "/lists";
    public static final String ADD_MEMBER_TO_CUSTOM_LIST = "/lists/{listId}/members";
    // Block URLs
    public static final String BLOCK_BASE = "/api/blocks";
    public static final String BLOCK_USER = "/{blockedUserId}";
    public static final String UNBLOCK_USER = "/{blockedUserId}";
    public static final String CHECK_BLOCK_STATUS = "{blockedUserId}/status";
    // Comment URLs
    public static final String COMMENT_BASE = "/api/comments";
    // Media URLs
    public static final String MEDIA_BASE = "/api/media";
    public static final String MEDIA_UPLOAD = "/upload";
    public static final String GET_MEDIA_BY_TARGET = "/target";
    public static final String MEDIA_FOR_POST = "/posts/{postId}/media";
    public static final String DELETE_MEDIA = "/{mediaId}";
}
