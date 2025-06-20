package com.example.social_media.controller;

import com.example.social_media.config.URLConfig;
import com.example.social_media.config.WebSocketConfig;
import com.example.social_media.dto.message.*;
import com.example.social_media.entity.CallSession;
import com.example.social_media.entity.User;
import com.example.social_media.exception.UnauthorizedException;
import com.example.social_media.jwt.JwtService;
import com.example.social_media.repository.UserRepository;
import com.example.social_media.service.CallSessionService;
import com.example.social_media.service.ChatService;
import com.example.social_media.service.MessageQueueService;
import com.example.social_media.service.MessageService;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping(URLConfig.CHAT_BASE)
public class ChatController {

    private final ChatService chatService;
    private final MessageService messageService;
    private final CallSessionService callSessionService;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final SimpMessagingTemplate messagingTemplate;
    private final WebSocketConfig webSocketConfig;
    private final MessageQueueService messageQueueService;

    public ChatController(ChatService chatService, MessageService messageService, CallSessionService callSessionService, UserRepository userRepository, JwtService jwtService, SimpMessagingTemplate messagingTemplate, WebSocketConfig webSocketConfig, MessageQueueService messageQueueService) {
        this.chatService = chatService;
        this.messageService = messageService;
        this.callSessionService = callSessionService;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.messagingTemplate = messagingTemplate;
        this.webSocketConfig = webSocketConfig;
        this.messageQueueService = messageQueueService;
    }

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
            System.out.println("Extracted token from session " + sessionId + ": " + authToken);
            if (authToken != null && authToken.startsWith("Bearer ")) {
                username = jwtService.extractUsername(authToken.substring(7));
            } else {
                System.err.println("No token found in sessionTokenMap for session " + sessionId);
            }
        }
        if (username == null) {
            throw new UnauthorizedException("Không thể xác thực người dùng.");
        }
        MessageDto savedMessage = messageService.sendMessage(messageDto, username);
        messageQueueService.queueAndSendMessage(savedMessage); // Sử dụng queue
        System.out.println("Message queued and broadcast to /topic/chat/" + messageDto.getChatId() + " with message: " + savedMessage.getContent());
    }
    @MessageMapping(URLConfig.TYPING)
    public void handleTyping(@Payload Map<String, Object> typingData) {
        Integer chatId = (Integer) typingData.get("chatId");
        Boolean isTyping = (Boolean) typingData.get("isTyping");
        Integer userId = (Integer) typingData.get("userId");
        messagingTemplate.convertAndSend("/topic/typing/" + chatId, typingData);
    }
    @MessageMapping({URLConfig.WEBSOCKET_CALL_OFFER, URLConfig.WEBSOCKET_CALL_ANSWER})
    public void handleCallSignal(@Payload SignalMessageDto signalMessage) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        callSessionService.handleSignal(signalMessage, username);
    }

    @GetMapping(URLConfig.GET_CHAT_MESSAGES)
    public List<MessageDto> getChatMessages(@PathVariable Integer chatId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return messageService.getChatMessages(chatId, username);
    }

    @GetMapping(URLConfig.CHATS)
    public List<ChatDto> getChats() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return chatService.getChats(username);
    }

    @PostMapping(URLConfig.CHAT_CREATE)
    public ChatDto createChat(@RequestBody ChatCreateDto chatCreateDto) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return chatService.createChat(username, chatCreateDto.getTargetUserId());
    }

    @PostMapping(URLConfig.CALL_START)
    public CallSessionDto startCall(@PathVariable Integer chatId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        CallSession callSession = callSessionService.startCall(chatId, username);
        return new CallSessionDto(callSession.getId(), callSession.getChat().getId(), callSession.getHost().getId(), callSession.getStartTime(), callSession.getEndTime());
    }

    @PostMapping(URLConfig.MESSAGE_DELETE)
    public void deleteMessage(@RequestBody Map<String, Integer> request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Integer chatId = request.get("chatId");
        Integer messageId = request.get("messageId");
        messageService.deleteMessage(chatId, messageId, username);
    }

    @PostMapping(URLConfig.CALL_END)
    public void endCall(@PathVariable Integer callSessionId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        callSessionService.endCall(callSessionId, username);
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
        messageQueueService.resendQueuedMessages(chatId, sessionId);
    }
}