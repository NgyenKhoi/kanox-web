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
    public static final String SAVE_POST = "/{postId}/save";
    public static final String HIDE_POST = "/{postId}/hide";
    public static final String UNSAVE_POST = "/unsave/{postId}";
    public static final String GET_SAVE_POST ="/saved-posts";
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
    public static final String MARK_READ = "/{chatId}/mark-read";
    public static final String WEBSOCKET_CALL_OFFER = "/call/offer";
    public static final String WEBSOCKET_CALL_ANSWER = "/call/answer";
    public static final String TYPING = "/typing";
    public static final String RESEND = "/resend";
    public static final String GET_CHAT = "/{chatId}";
    public static final String CHAT_DELETE = "/{chatId}/delete";
    public static final String CHAT_PING = "/ping";
    // Reaction URLs
    public static final String REACTION_BASE = "/api/reactions";
    public static final String GET_TOP_REACTION = "/top3";
    public static final String COUNT_REACTION = "/count";
    public static final String GET_REACTION_FOR_MESSAGE = "/messaging";
    public static final String GET_MAIN_REACTION = "/main";
    public static final String ADD_REACTION_BY_NAME = "/by-name";
    public static final String REMOVE_REACTION_BY_NAME = "/by-name";
    public static final String LIST_REACTION_BY_TYPE = "/list-by-type";
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
    public static final String MARK_READ_NOTIFICATION = "/{id}/mark-read";
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
    // Group URLs
    public static final String GROUP_BASE = "/api/groups";
    public static final String CREATE_GROUP ="/create";
    public static final String ADD_MEMBER = "/{groupId}/join";
    public static final String REMOVE_MEMBER = "/{groupId}/remove";
    public static final String ASSIGN_ADMIN ="/{groupId}/assign-admin";
    public static final String GET_MEMBER ="/{groupId}/members";
    public static final String INVITE_MEMBER ="/{groupId}/invite";
    public static final String ACCEPT_INVITE ="/{groupId}/accept";
    public static final String REJECT_INVITE ="/{groupId}/reject";
    public static final String PENDING_INVITE ="/pending-invites";
    public static final String REQUEST_JOIN_GROUP = "/{groupId}/request-join";
    public static final String APPROVE_JOIN_REQUEST = "/{groupId}/approve-request";
    public static final String REJECT_JOIN_REQUEST = "/{groupId}/reject-request";
    public static final String GET_JOIN_REQUESTS = "/{groupId}/join-requests";
    public static final String GET_GROUP_DETAIL = "/{groupId}/detail";
    public static final String DELETE_GROUP_BY_ADMIN = "/admin/{groupId}";  // NEW



    //Admin urls
    public static final String ADMIN_BASE = "/api/admin";
    public static final String GET_ALL_USER = "/users";
    public static final String MANAGE_USER_INFO = "/users/{userId}";
    public static final String UPDATE_USER_STATUS = "/users/{userId}/status";
    public static final String SEND_NOTIFICATION_FOR_USER = "/users/send-notification";
    //Admin report urls
    public static final String GET_REPORTS = "/list";
    public static final String UPDATE_REPORT_STATUS = "/{reportId}/status";
    public static final String MANAGE_REPORT_BY_ID = "/{reportId}";
    public static final String GET_REPORT_HISTORY = "/{reportId}/history";
    // Report URLs
    public static final String REPORT_BASE = "/api/reports";
    public static final String CREATE_REPORT = "/create";
    public static final String REPORT_REASON = "report-reasons";

}
