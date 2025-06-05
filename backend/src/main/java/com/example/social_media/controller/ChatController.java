package com.example.social_media.controller;

import com.example.social_media.dto.message.ChatDto;
import com.example.social_media.dto.message.MessageDto;
import com.example.social_media.entity.Chat;
import com.example.social_media.entity.Message;
import com.example.social_media.entity.MessageType;
import com.example.social_media.entity.User;
import com.example.social_media.repository.ChatMemberRepository;
import com.example.social_media.repository.MessageRepository;
import com.example.social_media.repository.MessageTypeRepository;
import com.example.social_media.service.CustomUserDetailsService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@RestController
public class ChatController {
    private final SimpMessagingTemplate messagingTemplate;
    private final MessageRepository messageRepository;
    private final MessageTypeRepository messageTypeRepository;
    private final ChatMemberRepository chatMemberRepository;
    private final CustomUserDetailsService userDetailsService;

    public ChatController(
            SimpMessagingTemplate messagingTemplate,
            MessageRepository messageRepository,
            MessageTypeRepository messageTypeRepository,
            ChatMemberRepository chatMemberRepository,
            CustomUserDetailsService userDetailsService) {
        this.messagingTemplate = messagingTemplate;
        this.messageRepository = messageRepository;
        this.messageTypeRepository = messageTypeRepository;
        this.chatMemberRepository = chatMemberRepository;
        this.userDetailsService = userDetailsService;
    }

    @MessageMapping("/sendMessage")
    public void sendMessage(@Payload MessageDto messageDto) {
        MessageType messageType = messageTypeRepository.findById(messageDto.getTypeId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid message type"));

        Message message = new Message();
        message.setChat(new Chat());
        message.getChat().setId(messageDto.getChatId().intValue()); // Ép Long sang Integer
        message.setSender(new User());
        message.getSender().setId(messageDto.getSenderId().intValue()); // Ép Long sang Integer
        message.setContent(messageDto.getContent());
        message.setType(messageType);
        message.setCreatedAt(Instant.now());

        messageRepository.save(message);

        messagingTemplate.convertAndSend("/topic/chat/" + messageDto.getChatId(), messageDto);
    }

    @GetMapping("/chat/{chatId}/messages")
    public List<MessageDto> getChatMessages(@PathVariable Long chatId) {
        return messageRepository.findByChatId(chatId.intValue()).stream() // Ép Long sang Integer
                .map(msg -> new MessageDto(
                        msg.getId().longValue(), // Ép Integer sang Long
                        msg.getChat().getId().longValue(),
                        msg.getSender().getId().longValue(),
                        msg.getContent(),
                        msg.getType().getId(),
                        msg.getCreatedAt()))
                .collect(Collectors.toList());
    }

    @GetMapping("/chats")
    public List<ChatDto> getChats() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userDetailsService.getUserByUsername(username); // Lấy User từ username
        Integer userId = user.getId(); // Lấy userId
        return chatMemberRepository.findByUserId(userId).stream()
                .map(chatMember -> {
                    Chat chat = chatMember.getChat();
                    Message lastMessage = messageRepository.findTopByChatIdOrderByCreatedAtDesc(chat.getId())
                            .orElse(null);
                    return new ChatDto(
                            chat.getId(),
                            chat.getName(),
                            lastMessage != null ? lastMessage.getContent() : ""
                    );
                })
                .collect(Collectors.toList());
    }
}