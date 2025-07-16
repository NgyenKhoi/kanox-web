package com.example.social_media.controller;

import com.example.social_media.config.URLConfig;
import com.example.social_media.config.WebSocketConfig;
import com.example.social_media.dto.message.*;
import com.example.social_media.entity.CallSession;
import com.example.social_media.entity.ChatMember;
import com.example.social_media.entity.User;
import com.example.social_media.exception.UnauthorizedException;
import com.example.social_media.jwt.JwtService;
import com.example.social_media.repository.ChatMemberRepository;
import com.example.social_media.repository.ChatRepository;
import com.example.social_media.repository.message.MessageRepository;
import com.example.social_media.repository.UserRepository;
import com.example.social_media.service.CallSessionService;
import com.example.social_media.service.ChatService;
import com.example.social_media.service.MessageQueueService;
import com.example.social_media.service.MessageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.elasticsearch.ResourceNotFoundException;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping(URLConfig.CHAT_BASE)
public class ChatController {

    @Value("${stringee.api-key-sid}")
    private String apiKeySid;

    @Value("${stringee.api-key-secret}")
    private String apiKeySecret;

    private final ChatService chatService;
    private final MessageService messageService;
    private final CallSessionService callSessionService;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final SimpMessagingTemplate messagingTemplate;
    private final WebSocketConfig webSocketConfig;
    private final MessageQueueService messageQueueService;
    private final RedisTemplate<String, MessageDto> redisTemplate;
    private final ChatMemberRepository chatMemberRepository;
    private final ChatRepository chatRepository;
    private final JdbcTemplate jdbcTemplate;
    private final MessageRepository messageRepository;

    public ChatController(ChatService chatService,
                          MessageService messageService,
                          CallSessionService callSessionService,
                          UserRepository userRepository,
                          JwtService jwtService,
                          SimpMessagingTemplate messagingTemplate,
                          WebSocketConfig webSocketConfig,
                          MessageQueueService messageQueueService,
                          RedisTemplate<String, MessageDto> redisTemplate,
                          ChatMemberRepository chatMemberRepository,
                          ChatRepository chatRepository,
                          JdbcTemplate jdbcTemplate,
                          MessageRepository messageRepository) {
        this.chatService = chatService;
        this.messageService = messageService;
        this.callSessionService = callSessionService;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.messagingTemplate = messagingTemplate;
        this.webSocketConfig = webSocketConfig;
        this.messageQueueService = messageQueueService;
        this.redisTemplate = redisTemplate;
        this.chatMemberRepository = chatMemberRepository;
        this.chatRepository = chatRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.messageRepository = messageRepository;
    }


    @MessageMapping(URLConfig.SEND_MESSAGES)
    public void sendMessage(@Payload MessageDto messageDto, @Header("simpSessionId") String sessionId) {
        System.out.println("Received message: " + messageDto.toString());
        String username = null;
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            username = authentication.getName();
        }
        if (username == null) {
            String authToken = webSocketConfig.sessionTokenMap.get(sessionId);
            if (authToken != null && authToken.startsWith("Bearer ")) {
                username = jwtService.extractUsername(authToken.substring(7));
            } else {
                System.err.println("No token found in sessionTokenMap for session " + sessionId);
                throw new UnauthorizedException("Không thể xác thực người dùng.");
            }
        }
        MessageDto savedMessage = messageService.sendMessage(messageDto, username);
        redisTemplate.opsForList().rightPush("chat:" + messageDto.getChatId() + ":messages", savedMessage);
        redisTemplate.convertAndSend("chat-messages", savedMessage);
        System.out.println("Message published to Redis channel chat-messages for chatId: " + messageDto.getChatId());

        // Publish tin nhắn đến topic /topic/chat/{chatId}
        messagingTemplate.convertAndSend("/topic/chat/" + messageDto.getChatId(), savedMessage);

        // Publish cập nhật danh sách chat và unread count
        List<ChatMember> members = chatMemberRepository.findByChatId(messageDto.getChatId());
        for (ChatMember member : members) {
            ChatDto userSpecificChat = chatService.convertToDto(
                    chatRepository.findById(messageDto.getChatId()).orElseThrow(() -> new IllegalArgumentException("Chat not found: " + messageDto.getChatId())),
                    member.getUser().getId()
            );
            messagingTemplate.convertAndSend("/topic/chats/" + member.getUser().getId(), userSpecificChat);
            System.out.println("Sent ChatDto to /topic/chats/" + member.getUser().getId() + ": ID=" + userSpecificChat.getId() +
                    ", Name=" + userSpecificChat.getName() +
                    ", Last Message=" + userSpecificChat.getLastMessage() +
                    ", Unread Messages Count=" + userSpecificChat.getUnreadMessagesCount());

            // Gửi thông báo unread count cho người nhận (ngoại trừ người gửi)
            if (!member.getUser().getId().equals(savedMessage.getSenderId())) {
                int unreadCount = messageService.getUnreadMessageCount(member.getUser().getId());
                messagingTemplate.convertAndSend("/topic/unread-count/" + member.getUser().getId(), Map.of("unreadCount", unreadCount));
                System.out.println("Sent unread chat count to /topic/unread-count/" + member.getUser().getId() + ": " + unreadCount);
            }
        }
    }

    @PostMapping(URLConfig.SEND_MESSAGES_WITH_MEDIA)
    public MessageDto sendMessageWithMedia(
            @PathVariable Integer chatId,
            @RequestPart("content") String content,
            @RequestPart(value = "media", required = false) List<MultipartFile> files
    ) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Integer senderId = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found")).getId();

        return messageService.sendMessageWithMedia(chatId, senderId, content, files);
    }

    @MessageMapping(URLConfig.TYPING)
    public void handleTyping(@Payload Map<String, Object> typingData) {
        Integer chatId = (Integer) typingData.get("chatId");
        Boolean isTyping = (Boolean) typingData.get("isTyping");
        Integer userId = (Integer) typingData.get("userId");
        messagingTemplate.convertAndSend("/topic/typing/" + chatId, typingData);
    }

    @MessageMapping(URLConfig.CHAT_PING)
    public void handlePing(@Header("simpSessionId") String sessionId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null && auth.isAuthenticated() ? auth.getName() : null;
        if (username == null) {
            String authToken = webSocketConfig.sessionTokenMap.get(sessionId);
            if (authToken != null && authToken.startsWith("Bearer ")) {
                username = jwtService.extractUsername(authToken.substring(7));
            } else {
                System.err.println("No token found in sessionTokenMap for session " + sessionId);
                throw new UnauthorizedException("Không thể xác thực người dùng.");
            }
        }
        messagingTemplate.convertAndSendToUser(sessionId, "/topic/ping", Map.of("status", "pong"));
    }

    @MessageMapping(URLConfig.CALL_END)
    public void handleCallEnd(@Payload Map<String, Integer> payload, @Header("simpSessionId") String sessionId) {
        Integer callSessionId = payload.get("callSessionId");
        Integer chatId = payload.get("chatId");
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        if (username == null) {
            String authToken = webSocketConfig.sessionTokenMap.get(sessionId);
            if (authToken != null && authToken.startsWith("Bearer ")) {
                username = jwtService.extractUsername(authToken.substring(7));
            } else {
                throw new UnauthorizedException("Không thể xác thực người dùng.");
            }
        }
        callSessionService.endCall(callSessionId, username);
        messagingTemplate.convertAndSend("/topic/call/" + chatId,
                new SignalMessageDto(chatId, "end", null, null, null));
    }

    @MessageMapping(URLConfig.WEBSOCKET_CALL_OFFER)
    public void handleCallOffer(@Payload SignalMessageDto signal, @Header("simpSessionId") String sessionId) {
        messagingTemplate.convertAndSend("/topic/call/" + signal.getChatId(), signal);
    }

    @MessageMapping(URLConfig.WEBSOCKET_CALL_ANSWER)
    public void handleCallAnswer(@Payload SignalMessageDto signal, @Header("simpSessionId") String sessionId) {
        messagingTemplate.convertAndSend("/topic/call/" + signal.getChatId(), signal);
    }

    @GetMapping(URLConfig.GET_CHAT_MESSAGES)
    public List<MessageDto> getChatMessages(@PathVariable Integer chatId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        List<MessageDto> messages = messageService.getChatMessages(chatId, username);
        redisTemplate.delete("chat:" + chatId + ":messages");
        messages.forEach(message ->
                redisTemplate.opsForList().rightPush("chat:" + chatId + ":messages", message));
        return messages;
    }

    @GetMapping(URLConfig.GET_CHAT)
    public ChatDto getChat(@PathVariable Integer chatId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return chatService.getChatById(chatId, username);
    }

    @GetMapping(URLConfig.CHATS)
    public List<ChatDto> getChats() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return chatService.getChats(username);
    }

    @PostMapping(URLConfig.CHAT_CREATE)
    public ChatDto createChat(@RequestBody ChatCreateDto chatCreateDto) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        ChatDto newChat = chatService.createChat(username, chatCreateDto.getTargetUserId());
        List<ChatMember> members = chatMemberRepository.findByChatId(newChat.getId());
        for (ChatMember member : members) {
            ChatDto userSpecificChat = chatService.convertToDto(
                    chatRepository.findById(newChat.getId()).orElseThrow(() -> new IllegalArgumentException("Chat not found: " + newChat.getId())),
                    member.getUser().getId()
            );
            messagingTemplate.convertAndSend("/topic/chats/" + member.getUser().getId(), userSpecificChat);
            System.out.println("Sent ChatDto to /topic/chats/" + member.getUser().getId() + ": ID=" + userSpecificChat.getId() +
                    ", Name=" + userSpecificChat.getName() +
                    ", Unread Messages Count=" + userSpecificChat.getUnreadMessagesCount());

            // Gửi thông báo unread count
            int unreadCount = messageService.getUnreadMessageCount(member.getUser().getId());
            messagingTemplate.convertAndSend("/topic/unread-count/" + member.getUser().getId(), Map.of("unreadCount", unreadCount));
            System.out.println("Sent unread chat count to /topic/unread-count/" + member.getUser().getId() + ": " + unreadCount);
        }
        System.out.println("Returning ChatDto to caller: ID=" + newChat.getId() + ", Name=" + newChat.getName());
        return newChat;
    }

    @DeleteMapping(URLConfig.CHAT_DELETE)
    public void deleteChat(@PathVariable Integer chatId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        chatService.deleteChat(chatId, username);
        System.out.println("Notifying user " + username + " of chat deletion: chatId=" + chatId);
        messagingTemplate.convertAndSend("/topic/chats/" + user.getId(),
                Map.of("action", "delete", "chatId", chatId));

        // Gửi thông báo unread count
        int unreadCount = messageService.getUnreadMessageCount(user.getId());
        messagingTemplate.convertAndSend("/topic/unread-count/" + user.getId(), Map.of("unreadCount", unreadCount));
        System.out.println("Sent unread chat count to /topic/unread-count/" + user.getId() + ": " + unreadCount);
    }

    @PostMapping(URLConfig.CALL_START)
    public CallSessionDto startCall(@PathVariable Integer chatId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        CallSession callSession = callSessionService.startCall(chatId, username);
        messagingTemplate.convertAndSend("/topic/call/" + chatId,
                new SignalMessageDto(chatId, "start", null, null, callSession.getHost().getId()));
        return new CallSessionDto(callSession.getId(), callSession.getChat().getId(),
                callSession.getHost().getId(), callSession.getStartTime(),
                callSession.getEndTime());
    }

    @PostMapping(URLConfig.CALL_END)
    public void endCall(@PathVariable Integer callSessionId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        callSessionService.endCall(callSessionId, username);
    }

    @PostMapping(URLConfig.MESSAGE_DELETE)
    public void deleteMessage(@RequestBody Map<String, Integer> request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Integer chatId = request.get("chatId");
        Integer messageId = request.get("messageId");
        messageService.deleteMessage(chatId, messageId, username);
        redisTemplate.opsForList().remove("chat:" + chatId + ":messages", 1, messageId);
    }

    @GetMapping(URLConfig.UNREAD_MESSAGE_COUNT)
    public Map<String, Integer> getUnreadMessageCount() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        int unreadCount = messageService.getUnreadMessageCount(user.getId());
        return Map.of("unreadCount", unreadCount);
    }

    @MessageMapping(URLConfig.RESEND)
    public void resendMessages(@Payload Map<String, Object> payload, @Header("simpSessionId") String sessionId) {
        String chatId = payload.get("chatId").toString();
        System.out.println("Resend requested for chatId: " + chatId);
        messageQueueService.resendQueuedMessages(chatId, sessionId);
    }

    @PutMapping(URLConfig.MARK_READ)
    public void markMessagesAsRead(@PathVariable Integer chatId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        messageService.markMessagesAsRead(chatId, user.getId());
    }


    @PostMapping("/generate-token")
    public Map<String, String> generateToken(@RequestBody Map<String, String> request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        long expirationTime = System.currentTimeMillis() / 1000 + 3600; // Token hết hạn sau 1 giờ
        String token = generateStringeeAccessToken(apiKeySid, apiKeySecret, username, expirationTime);
        return Map.of("accessToken", token);
    }

    private String generateStringeeAccessToken(String apiKeySid, String apiKeySecret, String userId, long expirationTime) {
        if (apiKeySid == null || apiKeySecret == null || userId == null) {
            throw new IllegalArgumentException("apiKeySid, apiKeySecret, or userId cannot be null");
        }

        String headerJson = "{\"alg\":\"HS256\",\"typ\":\"JWT\",\"cty\":\"stringee-api;v=1\"}";
        String payloadJson = String.format("{\"jti\":\"%s-%d\",\"iss\":\"%s\",\"exp\":%d,\"userId\":\"%s\"}",
                apiKeySid, System.currentTimeMillis(), apiKeySid, expirationTime, userId);

        String header = Base64.getUrlEncoder().withoutPadding().encodeToString(headerJson.getBytes(StandardCharsets.UTF_8));
        String payload = Base64.getUrlEncoder().withoutPadding().encodeToString(payloadJson.getBytes(StandardCharsets.UTF_8));

        String signatureInput = header + "." + payload;
        String signature = base64UrlEncode(hmacSha256Bytes(signatureInput, apiKeySecret));

        return signatureInput + "." + signature;
    }

    private byte[] hmacSha256Bytes(String data, String key) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            // ✅ Không decode base64 — dùng raw secret
            SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            return mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate HMAC SHA256", e);
        }
    }

    private String base64UrlEncode(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }


    @GetMapping(URLConfig.GET_CHAT_MEMBERS)
    public List<Map<String, Object>> getChatMembers(@PathVariable Integer chatId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        chatService.checkChatAccess(chatId, username);
        List<ChatMember> members = chatMemberRepository.findByChatId(chatId);
        return members.stream()
                .map(member -> {
                    Map<String, Object> memberMap = new HashMap<>();
                    memberMap.put("userId", member.getUser().getId());
                    memberMap.put("username", member.getUser().getUsername());
                    memberMap.put("stringeeUserId", member.getUser().getUsername());
                    memberMap.put("displayName", member.getUser().getDisplayName());
                    memberMap.put("isSpam", member.getIsSpam()); // Thêm isSpam
                    return memberMap;
                })
                .collect(Collectors.toList());
    }

    @GetMapping(URLConfig.GET_USER_CHAT)
    public List<Map<String, Object>> getUserChats(@PathVariable Integer userId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!user.getId().equals(userId)) {
            throw new UnauthorizedException("Unauthorized access to chat list");
        }
        List<ChatMember> members = chatMemberRepository.findByUserId(userId);
        return members.stream()
                .map(member -> {
                    Map<String, Object> chatMap = new HashMap<>();
                    chatMap.put("id", member.getChat().getId());
                    return chatMap;
                })
                .collect(Collectors.toList());
    }

    @PostMapping(URLConfig.MARK_SPAM)
    public void markChatMemberAsSpam(@RequestBody SpamRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Integer chatId = request.getChatId();
        Integer targetUserId = request.getTargetUserId();

        // Kiểm tra quyền truy cập
        chatService.checkChatAccess(chatId, username);

        // Gọi stored procedure sp_MarkChatMemberAsSpam
        try {
            jdbcTemplate.update("EXEC sp_MarkChatMemberAsSpam @chat_id = ?, @user_id = ?, @target_user_id = ?",
                    chatId, user.getId(), targetUserId);
            System.out.println("Marked userId " + targetUserId + " as spam in chatId " + chatId);

            // Gửi thông báo qua WebSocket
            messagingTemplate.convertAndSend("/topic/spam-status/" + chatId,
                    new SpamStatusDto(chatId, true));
        } catch (Exception e) {
            System.err.println("Error marking spam: " + e.getMessage());
            throw new RuntimeException("Failed to mark user as spam: " + e.getMessage());
        }
    }

    @PostMapping(URLConfig.UNMARK_SPAM)
    public void unmarkChatMemberAsSpam(@RequestBody SpamRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Integer chatId = request.getChatId();
        Integer targetUserId = request.getTargetUserId();

        // Kiểm tra quyền truy cập
        chatService.checkChatAccess(chatId, username);

        // Gọi stored procedure sp_UnmarkChatMemberAsSpam
        try {
            jdbcTemplate.update("EXEC sp_UnmarkChatMemberAsSpam @chat_id = ?, @user_id = ?, @target_user_id = ?",
                    chatId, user.getId(), targetUserId);
            System.out.println("Unmarked userId " + targetUserId + " as spam in chatId " + chatId);

            // Gửi thông báo qua WebSocket
            messagingTemplate.convertAndSend("/topic/spam-status/" + chatId,
                    new SpamStatusDto(chatId, false));
        } catch (Exception e) {
            System.err.println("Error unmarking spam: " + e.getMessage());
            throw new RuntimeException("Failed to unmark user as spam: " + e.getMessage());
        }
    }
    @GetMapping(URLConfig.GET_SPAM_MESSAGE)
    public List<MessageDto> getSpamMessages(@PathVariable Integer chatId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        chatService.checkChatAccess(chatId, username);
        List<ChatMember> spamMembers = chatMemberRepository.findByChatIdAndIsSpam(chatId, true);
        List<Integer> spamUserIds = spamMembers.stream()
                .map(cm -> cm.getUser().getId())
                .collect(Collectors.toList());

        return messageRepository.findByChatIdAndSenderIdIn(chatId, spamUserIds).stream()
                .map(msg -> new MessageDto(
                        msg.getId(),
                        msg.getChat().getId(),
                        msg.getSender().getId(),
                        msg.getContent(),
                        msg.getType().getId(),
                        msg.getCreatedAt()))
                .collect(Collectors.toList());
    }
}