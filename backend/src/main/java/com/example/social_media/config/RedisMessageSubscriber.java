package com.example.social_media.config;

import com.example.social_media.dto.message.MessageDto;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class RedisMessageSubscriber {

    private final SimpMessagingTemplate messagingTemplate;

    public RedisMessageSubscriber(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void onMessageReceived(MessageDto messageDto) {
        messagingTemplate.convertAndSend("/topic/chat/" + messageDto.getChatId(), messageDto);
        System.out.println("Received message from Redis for chatId " + messageDto.getChatId() + ": " + messageDto.getContent());
    }
}