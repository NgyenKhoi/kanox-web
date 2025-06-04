package com.example.social_media.controller;

import com.example.social_media.dto.message.SignalMessageDto;
import com.example.social_media.repository.ChatMemberRepository;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;

@Controller
public class SignalingController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatMemberRepository chatMemberRepository;

    public SignalingController(SimpMessagingTemplate messagingTemplate, ChatMemberRepository chatMemberRepository) {
        this.messagingTemplate = messagingTemplate;
        this.chatMemberRepository = chatMemberRepository;
    }

    @MessageMapping("/call/offer")
    public void handleOffer(@Payload SignalMessageDto signal) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        boolean isMember = chatMemberRepository.existsByChatIdAndUserUsername(signal.getChatId(), username);
        if (!isMember) {
            throw new SecurityException("User is not a member of this chat");
        }
        messagingTemplate.convertAndSend("/topic/call/" + signal.getChatId(), signal);
    }

    @MessageMapping("/call/answer")
    public void handleAnswer(@Payload SignalMessageDto signal) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        boolean isMember = chatMemberRepository.existsByChatIdAndUserUsername(signal.getChatId(), username);
        if (!isMember) {
            throw new SecurityException("User is not a member of this chat");
        }
        messagingTemplate.convertAndSend("/topic/call/" + signal.getChatId(), signal);
    }

    @MessageMapping("/call/ice-candidate")
    public void handleIceCandidate(@Payload SignalMessageDto signal) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        boolean isMember = chatMemberRepository.existsByChatIdAndUserUsername(signal.getChatId(), username);
        if (!isMember) {
            throw new SecurityException("User is not a member of this chat");
        }
        messagingTemplate.convertAndSend("/topic/call/" + signal.getChatId(), signal);
    }
}