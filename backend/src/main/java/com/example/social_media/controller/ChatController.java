package com.example.social_media.controller;

import com.example.social_media.config.URLConfig;
import com.example.social_media.dto.MessageDto;
import com.example.social_media.entity.Chat;
import com.example.social_media.entity.Message;
import com.example.social_media.entity.MessageType;
import com.example.social_media.entity.User;
import com.example.social_media.repository.ChatMemberRepository;
import com.example.social_media.repository.MessageRepository;
import com.example.social_media.repository.MessageTypeRepository;
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
    private final ChatMemberRepository chatMemberRepository;
    private final MessageTypeRepository messageTypeRepository;

    public ChatController(SimpMessagingTemplate messagingTemplate,
                          MessageRepository messageRepository,
                          ChatMemberRepository chatMemberRepository,
                          MessageTypeRepository messageTypeRepository) {
        this.messagingTemplate = messagingTemplate;
        this.messageRepository = messageRepository;
        this.chatMemberRepository = chatMemberRepository;
        this.messageTypeRepository = messageTypeRepository;
    }

    @MessageMapping("/sendMessage")
    public void sendMessage(@Payload MessageDto messageDto) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        boolean isMember = chatMemberRepository.existsByChatIdAndUserUsername(messageDto.getChatId(), username);
        if (!isMember) {
            throw new SecurityException("User is not a member of this chat");
        }

        if (messageDto.getTypeId() == null || !messageTypeRepository.existsById(messageDto.getTypeId())) {
            throw new IllegalArgumentException("Invalid message type");
        }

        Message message = new Message();
        message.setChat(new Chat() {{ setId(messageDto.getChatId()); }});
        message.setSender(new User() {{ setId(messageDto.getSenderId()); }});
        message.setType(new MessageType() {{ setId(messageDto.getTypeId()); }});
        message.setContent(messageDto.getContent());
        message.setCreatedAt(Instant.now());
        message.setMediaUrl(messageDto.getMediaUrl());
        message.setMediaType(messageDto.getMediaType());
        message.setStatus(true);

        messageRepository.save(message);

        MessageDto responseDto = new MessageDto();
        responseDto.setId(message.getId());
        responseDto.setChatId(message.getChat().getId());
        responseDto.setSenderId(message.getSender().getId());
        responseDto.setTypeId(message.getType().getId());
        responseDto.setContent(message.getContent());
        responseDto.setCreatedAt(message.getCreatedAt());
        responseDto.setMediaUrl(message.getMediaUrl());
        responseDto.setMediaType(message.getMediaType());
        responseDto.setStatus(message.getStatus());

        messagingTemplate.convertAndSend("/topic/chat/" + messageDto.getChatId(), responseDto);
    }

    @GetMapping(URLConfig.CHAT_MESSAGES)
    public List<MessageDto> getMessages(@PathVariable("chatId") Integer chatId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        boolean isMember = chatMemberRepository.existsByChatIdAndUserUsername(chatId, username);
        if (!isMember) {
            throw new SecurityException("User is not a member of this chat");
        }

        return messageRepository.findByChatId(chatId).stream()
                .map(message -> {
                    MessageDto dto = new MessageDto();
                    dto.setId(message.getId());
                    dto.setChatId(message.getChat().getId());
                    dto.setSenderId(message.getSender().getId());
                    dto.setTypeId(message.getType().getId());
                    dto.setContent(message.getContent());
                    dto.setCreatedAt(message.getCreatedAt());
                    dto.setMediaUrl(message.getMediaUrl());
                    dto.setMediaType(message.getMediaType());
                    dto.setStatus(message.getStatus());
                    return dto;
                })
                .collect(Collectors.toList());
    }
}