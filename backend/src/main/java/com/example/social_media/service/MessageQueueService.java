package com.example.social_media.service;

import com.example.social_media.dto.message.MessageDto;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MessageQueueService {

    private final RedisTemplate<String, MessageDto> redisTemplate;
    private final SimpMessagingTemplate messagingTemplate;

    public MessageQueueService(RedisTemplate<String, MessageDto> redisTemplate, SimpMessagingTemplate messagingTemplate) {
        this.redisTemplate = redisTemplate;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public void queueAndSendMessage(MessageDto messageDto) {
        // Lưu tin nhắn vào Redis với key là chatId
        String key = "chat:" + messageDto.getChatId() + ":messages";
        System.out.println("Queuing message for chatId: " + messageDto.getChatId() + ", content: " + messageDto.getContent());
        redisTemplate.opsForList().rightPush(key, messageDto);

        // Giới hạn số tin nhắn lưu (ví dụ: 100 tin nhắn gần nhất)
        redisTemplate.opsForList().trim(key, 0, 99);
        System.out.println("Broadcasting message to /topic/chat/" + messageDto.getChatId() + ": " + messageDto.getContent());
        // Broadcast ngay lập tức
        messagingTemplate.convertAndSend("/topic/chat/" + messageDto.getChatId(), messageDto);
    }

    @Transactional
    public void resendQueuedMessages(String chatId, String sessionId) {
        String key = "chat:" + chatId + ":messages";
        List<MessageDto> queuedMessages = redisTemplate.opsForList().range(key, 0, -1);
        for (MessageDto message : queuedMessages) {
            messagingTemplate.convertAndSendToUser(sessionId, "/topic/chat/" + chatId, message);
        }
    }
}