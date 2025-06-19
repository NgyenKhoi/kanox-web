package com.example.social_media.service;

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

    public MessageService(MessageRepository messageRepository, MessageTypeRepository messageTypeRepository,
                          ChatRepository chatRepository, UserRepository userRepository,
                          SimpMessagingTemplate messagingTemplate, ChatService chatService,
                          ChatMemberRepository chatMemberRepository, MessageStatusRepository messageStatusRepository) {
        this.messageRepository = messageRepository;
        this.messageTypeRepository = messageTypeRepository;
        this.chatRepository = chatRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
        this.chatService = chatService;
        this.chatMemberRepository = chatMemberRepository;
        this.messageStatusRepository = messageStatusRepository;
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

        Message message = new Message();
        message.setChat(chat);
        message.setSender(sender);
        message.setContent(messageDto.getContent());
        message.setType(messageType);
        message.setCreatedAt(Instant.now());
        message = messageRepository.save(message); // Lưu và lấy entity đã lưu

        // Lưu trạng thái tin nhắn cho tất cả thành viên trong chat (trừ người gửi)
        List<ChatMember> members = chatMemberRepository.findByChatId(messageDto.getChatId().intValue());
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

        // Cập nhật messageDto với id và createdAt từ message đã lưu
        messageDto.setId(message.getId());
        messageDto.setCreatedAt(message.getCreatedAt());
        messagingTemplate.convertAndSend("/topic/chat/" + messageDto.getChatId(), messageDto);

        // Gửi thông báo tin nhắn mới tới các thành viên
        for (ChatMember member : members) {
            if (!member.getUser().getId().equals(sender.getId())) {
                System.out.println("Broadcasting to /topic/chat/" + messageDto.getChatId() + ": " + messageDto.getContent());
                messagingTemplate.convertAndSend(
                        "/topic/messages/" + member.getUser().getId(),
                        messageDto
                );
            }
        }

        return messageDto; // Trả về messageDto đã cập nhật
    }

    @Transactional(readOnly = true)
    public List<MessageDto> getChatMessages(Integer chatId, String username) {
        chatService.checkChatAccess(chatId, username);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Đánh dấu tất cả tin nhắn trong chat này là đã đọc
        messageStatusRepository.findByMessageChatIdAndUserId(chatId, user.getId())
                .forEach(status -> {
                    status.setStatus("read");
                    messageStatusRepository.save(status);
                });

        return messageRepository.findByChatId(chatId).stream()
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
        return messageStatusRepository.countUnreadByUserId(userId);
    }
}