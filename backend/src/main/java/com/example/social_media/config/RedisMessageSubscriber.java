package com.example.social_media.config;

import com.example.social_media.dto.message.MessageDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class RedisMessageSubscriber implements MessageListener {

    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    public RedisMessageSubscriber(SimpMessagingTemplate messagingTemplate, ObjectMapper objectMapper) {
        this.messagingTemplate = messagingTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            // Deserialize message body thành MessageDto
            MessageDto messageDto = objectMapper.readValue(message.getBody(), MessageDto.class);
            // Gửi qua WebSocket
            messagingTemplate.convertAndSend("/topic/chat/" + messageDto.getChatId(), messageDto);
            System.out.println("Received message from Redis for chatId " + messageDto.getChatId() + ": " + messageDto.getContent());
        } catch (Exception e) {
            System.err.println("Error processing Redis message: " + e.getMessage());
        }
    }
}