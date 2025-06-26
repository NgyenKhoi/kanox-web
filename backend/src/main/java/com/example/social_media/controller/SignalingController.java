package com.example.social_media.controller;

import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.example.social_media.config.WebSocketConfig;
import com.example.social_media.dto.message.SignalMessageDto;
import com.example.social_media.exception.UnauthorizedException;
import com.example.social_media.jwt.JwtService;
import com.example.social_media.repository.ChatMemberRepository;

@Controller
public class SignalingController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatMemberRepository chatMemberRepository;
    private final JwtService jwtService;
    private final WebSocketConfig webSocketConfig;

    public SignalingController(SimpMessagingTemplate messagingTemplate,
            ChatMemberRepository chatMemberRepository,
            JwtService jwtService,
            WebSocketConfig webSocketConfig) {
        this.messagingTemplate = messagingTemplate;
        this.chatMemberRepository = chatMemberRepository;
        this.jwtService = jwtService;
        this.webSocketConfig = webSocketConfig;
    }

    private String getAuthenticatedUsername(String sessionId) {
        String username = null;
        String authToken = webSocketConfig.sessionTokenMap.get(sessionId);
        if (authToken != null && authToken.startsWith("Bearer ")) {
            try {
                username = jwtService.extractUsername(authToken.substring(7));
                if (username == null || jwtService.isTokenExpired(authToken.substring(7))) {
                    throw new UnauthorizedException("Invalid or expired JWT token");
                }
                System.out.println("Extracted username from sessionTokenMap: " + username);
            } catch (Exception e) {
                System.err.println("Error extracting username from token: " + e.getMessage());
                throw new UnauthorizedException("Không thể xác thực người dùng từ token.");
            }
        } else {
            System.err.println("No token found in sessionTokenMap for session " + sessionId);
            throw new UnauthorizedException("Không thể xác thực người dùng.");
        }
        return username;
    }

    @MessageMapping("/call/offer")
    public void handleOffer(@Payload SignalMessageDto signal, @Header("simpSessionId") String sessionId) {
        String username = getAuthenticatedUsername(sessionId);
        if (!chatMemberRepository.existsByChatIdAndUserUsername(signal.getChatId(), username)) {
            throw new SecurityException("User is not a member of this chat");
        }
        System.out.println("Received offer for chatId: " + signal.getChatId() + ", from user: " + username);
        messagingTemplate.convertAndSend("/topic/call/" + signal.getChatId(), signal);
    }

    @MessageMapping("/call/answer")
    public void handleAnswer(@Payload SignalMessageDto signal, @Header("simpSessionId") String sessionId) {
        String username = getAuthenticatedUsername(sessionId);
        if (!chatMemberRepository.existsByChatIdAndUserUsername(signal.getChatId(), username)) {
            throw new SecurityException("User is not a member of this chat");
        }
        System.out.println("Received answer for chatId: " + signal.getChatId() + ", from user: " + username);
        messagingTemplate.convertAndSend("/topic/call/" + signal.getChatId(), signal);
    }

    @MessageMapping("/call/ice-candidate")
    public void handleIceCandidate(@Payload SignalMessageDto signal, @Header("simpSessionId") String sessionId) {
        String username = getAuthenticatedUsername(sessionId);
        if (!chatMemberRepository.existsByChatIdAndUserUsername(signal.getChatId(), username)) {
            throw new SecurityException("User is not a member of this chat");
        }
        System.out.println("Received ICE candidate for chatId: " + signal.getChatId() +
                ", candidate: " + (signal.getCandidate() != null ? signal.getCandidate().getCandidate() : "null") +
                ", from user: " + username);
        messagingTemplate.convertAndSend("/topic/call/" + signal.getChatId(), signal);
    }
}
