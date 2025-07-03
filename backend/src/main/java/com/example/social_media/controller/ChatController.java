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
import com.example.social_media.repository.UserRepository;
import com.example.social_media.service.CallSessionService;
import com.example.social_media.service.ChatService;
import com.example.social_media.service.MessageQueueService;
import com.example.social_media.service.MessageService;
import org.springframework.beans.factory.annotation.Value;
import org.apache.commons.codec.binary.Hex;
import org.springframework.data.elasticsearch.ResourceNotFoundException;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

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
                          ChatRepository chatRepository) {
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
    }
//
//    @MessageMapping(URLConfig.SEND_MESSAGES)
//    public void sendMessage(@Payload MessageDto messageDto, @Header("simpSessionId") String sessionId) {
//        System.out.println("Processing message: " + messageDto.getContent() + " for chatId: " + messageDto.getChatId());
//        String username = null;
//        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
//        if (authentication != null && authentication.isAuthenticated()) {
//            username = authentication.getName();
//        }
//        if (username == null) {
//            String authToken = webSocketConfig.sessionTokenMap.get(sessionId);
//            System.out.println("Extracted token from session " + sessionId + ": " + authToken);
//            if (authToken != null && authToken.startsWith("Bearer ")) {
//                username = jwtService.extractUsername(authToken.substring(7));
//            } else {
//                System.err.println("No token found in sessionTokenMap for session " + sessionId);
//            }
//        }
//        if (username == null) {
//            throw new UnauthorizedException("Không thể xác thực người dùng.");
//        }
//        MessageDto savedMessage = messageService.sendMessage(messageDto, username);
//        redisTemplate.opsForList().rightPush("chat:" + messageDto.getChatId() + ":messages", savedMessage);
//        redisTemplate.convertAndSend("chat-messages", savedMessage);
//        System.out.println("Message published to Redis channel chat-messages for chatId: " + messageDto.getChatId());
//    }

    @MessageMapping(URLConfig.SEND_MESSAGES)
    public void sendMessage(@Payload MessageDto messageDto, @Header("simpSessionId") String sessionId) {
        System.out.println("Processing message: " + messageDto.getContent() + " for chatId: " + messageDto.getChatId());
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

        // Publish tin nhắn đến topic /topic/chat/{chatId} để hiển thị real-time trong khung chat
        messagingTemplate.convertAndSend("/topic/chat/" + messageDto.getChatId(), savedMessage);

        // Publish cập nhật danh sách chat cho cả hai người dùng
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
        }
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
            System.out.println("Sending ChatDto to /topic/chats/" + member.getUser().getId() + ": ID=" + userSpecificChat.getId() +
                    ", Name=" + userSpecificChat.getName() +
                    ", Unread Messages Count=" + userSpecificChat.getUnreadMessagesCount());
            messagingTemplate.convertAndSend("/topic/chats/" + member.getUser().getId(), userSpecificChat);
        }
        System.out.println("Returning ChatDto to caller: ID=" + newChat.getId() + ", Name=" + newChat.getName());
        return newChat;
    }

    @DeleteMapping(URLConfig.CHAT_DELETE)
    public void deleteChat(@PathVariable Integer chatId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        chatService.deleteChat(chatId, username);
        System.out.println("Notifying user " + username + " of chat deletion: chatId=" + chatId);
        messagingTemplate.convertAndSend("/topic/chats/" + userRepository.findByUsername(username)
                        .orElseThrow(() -> new IllegalArgumentException("User not found")).getId(),
                Map.of("action", "delete", "chatId", chatId));
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


    @GetMapping("/{chatId}/members")
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
                    return memberMap;
                })
                .collect(Collectors.toList());
    }

    @GetMapping("/user/{userId}")
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
}