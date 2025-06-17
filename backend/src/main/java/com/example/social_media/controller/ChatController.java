package com.example.social_media.controller;

import com.example.social_media.dto.message.*;
import com.example.social_media.entity.CallSession;
import com.example.social_media.entity.User;
import com.example.social_media.repository.UserRepository;
import com.example.social_media.service.CallSessionService;
import com.example.social_media.service.ChatService;
import com.example.social_media.service.MessageService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class ChatController {

    private final ChatService chatService;
    private final MessageService messageService;
    private final CallSessionService callSessionService;
    private final UserRepository userRepository;

    public ChatController(ChatService chatService, MessageService messageService, CallSessionService callSessionService, UserRepository userRepository) {
        this.chatService = chatService;
        this.messageService = messageService;
        this.callSessionService = callSessionService;
        this.userRepository = userRepository;
    }

    @MessageMapping("/sendMessage")
    public void sendMessage(@Payload MessageDto messageDto) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        messageService.sendMessage(messageDto, username);
    }

    @MessageMapping({"/call/offer", "/call/answer"})
    public void handleCallSignal(@Payload SignalMessageDto signalMessage) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        callSessionService.handleSignal(signalMessage, username);
    }

    @GetMapping("/chat/{chatId}/messages")
    public List<MessageDto> getChatMessages(@PathVariable Integer chatId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return messageService.getChatMessages(chatId, username);
    }

    @GetMapping("/chats")
    public List<ChatDto> getChats() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return chatService.getChats(username);
    }

    @PostMapping("/chat/create")
    public ChatDto createChat(@RequestBody ChatCreateDto chatCreateDto) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return chatService.createChat(username, chatCreateDto.getTargetUserId());
    }

    @PostMapping("/call/start/{chatId}")
    public CallSessionDto startCall(@PathVariable Integer chatId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        CallSession callSession = callSessionService.startCall(chatId, username);
        return new CallSessionDto(callSession.getId(), callSession.getChat().getId(), callSession.getHost().getId(), callSession.getStartTime(), callSession.getEndTime());
    }

    @PostMapping("/message/delete")
    public void deleteMessage(@RequestBody Map<String, Integer> request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Integer chatId = request.get("chatId");
        Integer messageId = request.get("messageId");
        messageService.deleteMessage(chatId, messageId, username);
    }

    @PostMapping("/call/end/{callSessionId}")
    public void endCall(@PathVariable Integer callSessionId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        callSessionService.endCall(callSessionId, username);
    }

    @GetMapping("/messages/unread-count")
    public Map<String, Integer> getUnreadMessageCount() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        int unreadCount = messageService.getUnreadMessageCount(user.getId());
        return Map.of("unreadCount", unreadCount);
    }
}