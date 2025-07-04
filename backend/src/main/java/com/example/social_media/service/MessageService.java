package com.example.social_media.service;

import com.example.social_media.dto.message.ChatDto;
import com.example.social_media.dto.message.MessageDto;
import com.example.social_media.entity.*;
import com.example.social_media.exception.UnauthorizedException;
import com.example.social_media.repository.ChatMemberRepository;
import com.example.social_media.repository.ChatRepository;
import com.example.social_media.repository.MessageRepository;
import com.example.social_media.repository.MessageTypeRepository;
import com.example.social_media.repository.UserRepository;
import com.example.social_media.repository.MessageStatusRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class MessageService {

    private final MessageRepository messageRepository;
    private final MessageTypeRepository messageTypeRepository;
    private final ChatRepository chatRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ChatService chatService;
    private final ChatMemberRepository chatMemberRepository;
    private final MessageStatusRepository messageStatusRepository;
    private final MessageQueueService messageQueueService;

    public MessageService(MessageRepository messageRepository, MessageTypeRepository messageTypeRepository,
                          ChatRepository chatRepository, UserRepository userRepository,
                          SimpMessagingTemplate messagingTemplate, ChatService chatService,
                          ChatMemberRepository chatMemberRepository, MessageStatusRepository messageStatusRepository,
                          MessageQueueService messageQueueService) {
        this.messageRepository = messageRepository;
        this.messageTypeRepository = messageTypeRepository;
        this.chatRepository = chatRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
        this.chatService = chatService;
        this.chatMemberRepository = chatMemberRepository;
        this.messageStatusRepository = messageStatusRepository;
        this.messageQueueService = messageQueueService;
    }

    @Transactional
    public MessageDto sendMessage(MessageDto messageDto, String username) {
        chatService.checkChatAccess(messageDto.getChatId().intValue(), username);

        MessageType messageType = messageTypeRepository.findById(messageDto.getTypeId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid message type"));

        Chat chat = chatRepository.findById(messageDto.getChatId().intValue())
                .orElseThrow(() -> new IllegalArgumentException("Chat not found"));

        User sender = userRepository.findById(messageDto.getSenderId().intValue())
                .orElseThrow(() -> new IllegalArgumentException("Sender not found"));

        // Khôi phục ChatMember.status của người nhận nếu status=false
        List<ChatMember> members = chatMemberRepository.findByChatId(messageDto.getChatId().intValue());
        for (ChatMember member : members) {
            if (!member.getUser().getId().equals(sender.getId()) && !member.getStatus()) {
                member.setStatus(true);
                member.setJoinedAt(Instant.now());
                chatMemberRepository.save(member);
                ChatDto chatDto = chatService.convertToDto(chat, member.getUser().getId());
                messagingTemplate.convertAndSend("/topic/chats/" + member.getUser().getId(), chatDto);
            }
        }

        Message message = new Message();
        message.setChat(chat);
        message.setSender(sender);
        message.setContent(messageDto.getContent());
        message.setType(messageType);
        message.setCreatedAt(Instant.now());
        message = messageRepository.save(message);

        messageDto.setId(message.getId());
        messageDto.setCreatedAt(message.getCreatedAt());
        messageQueueService.queueAndSendMessage(messageDto);

        for (ChatMember member : members) {
            if (!member.getUser().getId().equals(sender.getId())) {
                MessageStatus status = new MessageStatus();
                status.setId(new MessageStatusId(message.getId(), member.getUser().getId()));
                status.setMessage(message);
                status.setUser(member.getUser());
                status.setStatus("unread");
                status.setCreatedAt(Instant.now());
                messageStatusRepository.save(status);
            }
        }

        for (ChatMember member : members) {
            if (!member.getUser().getId().equals(sender.getId())) {
                messagingTemplate.convertAndSend("/topic/messages/" + member.getUser().getId(), messageDto);
            }
        }

        return messageDto;
    }

    @Transactional
    public List<MessageDto> getChatMessages(Integer chatId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        ChatMember chatMember = chatMemberRepository.findByChatIdAndUserId(chatId, user.getId())
                .orElseThrow(() -> new UnauthorizedException("You are not a member of this chat."));
        if (!chatMember.getStatus()) {
            return List.of();
        }

        // Lấy joinedAt của người dùng để lọc tin nhắn
        Instant joinedAt = chatMember.getJoinedAt();

        // Đánh dấu tất cả tin nhắn chưa đọc trong chat này là đã đọc
        messageStatusRepository.markAllAsReadByChatIdAndUserId(chatId, user.getId());
        System.out.println("Marked all messages as read for chatId " + chatId + " and userId " + user.getId());

        // Gửi thông báo cập nhật unread count qua WebSocket
        int updatedUnreadCount = messageStatusRepository.countUnreadChatsByUserId(user.getId());
        messagingTemplate.convertAndSend("/topic/unread-count/" + user.getId(), Map.of("unreadCount", updatedUnreadCount));
        System.out.println("Sent unread chat count to /topic/unread-count/" + user.getId() + ": " + updatedUnreadCount);

        // Chỉ trả về tin nhắn có createdAt sau joinedAt
        return messageRepository.findByChatId(chatId).stream()
                .filter(msg -> msg.getCreatedAt().isAfter(joinedAt))
                .map(msg -> new MessageDto(
                        msg.getId(),
                        msg.getChat().getId(),
                        msg.getSender().getId(),
                        msg.getContent(),
                        msg.getType().getId(),
                        msg.getCreatedAt()))
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteMessage(Integer chatId, Integer messageId, String username) {
        chatService.checkChatAccess(chatId, username);
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found"));
        if (!message.getSender().getUsername().equals(username)) {
            throw new UnauthorizedException("You can only delete your own messages.");
        }
        messageRepository.delete(message);
        messagingTemplate.convertAndSend("/topic/chat/" + chatId, new MessageDto(messageId, chatId, null, "Message deleted", 0, Instant.now()));
    }

    @Transactional(readOnly = true)
    public int getUnreadMessageCount(Integer userId) {
        int count = messageStatusRepository.countUnreadChatsByUserId(userId);
        System.out.println("Unread **chat** count for userId " + userId + ": " + count);
        return count;
    }

    public void markMessagesAsRead(Integer chatId, Integer userId) {
        messageStatusRepository.markAllAsReadByChatIdAndUserId(chatId, userId);
    }
}
