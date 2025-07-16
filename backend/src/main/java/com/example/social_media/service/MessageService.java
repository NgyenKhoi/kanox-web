package com.example.social_media.service;

import com.example.social_media.dto.media.MediaDto;
import com.example.social_media.dto.message.ChatDto;
import com.example.social_media.dto.message.MessageDto;
import com.example.social_media.entity.*;
import com.example.social_media.exception.UnauthorizedException;
import com.example.social_media.repository.ChatMemberRepository;
import com.example.social_media.repository.ChatRepository;
import com.example.social_media.repository.message.JdbcMessageRepository;
import com.example.social_media.repository.message.MessageRepository;
import com.example.social_media.repository.UserRepository;
import com.example.social_media.repository.message.MessageStatusRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class MessageService {

    private final MessageRepository messageRepository;
    private final ChatRepository chatRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ChatService chatService;
    private final ChatMemberRepository chatMemberRepository;
    private final MessageStatusRepository messageStatusRepository;
    private final MessageQueueService messageQueueService;
    private final JdbcTemplate jdbcTemplate;
    private final MediaService mediaService;
    private final GcsService gcsService;
    private final JdbcMessageRepository jdbcMessageRepository;

    public MessageService(MessageRepository messageRepository,
                          ChatRepository chatRepository, UserRepository userRepository,
                          SimpMessagingTemplate messagingTemplate, ChatService chatService,
                          ChatMemberRepository chatMemberRepository, MessageStatusRepository messageStatusRepository,
                          MessageQueueService messageQueueService, JdbcTemplate jdbcTemplate,
                          MediaService mediaService,  GcsService gcsService, JdbcMessageRepository jdbcMessageRepository) {
        this.messageRepository = messageRepository;
        this.chatRepository = chatRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
        this.chatService = chatService;
        this.chatMemberRepository = chatMemberRepository;
        this.messageStatusRepository = messageStatusRepository;
        this.messageQueueService = messageQueueService;
        this.jdbcTemplate = jdbcTemplate;
        this.mediaService = mediaService;
        this.gcsService = gcsService;
        this.jdbcMessageRepository = jdbcMessageRepository;
    }

    @Transactional
    public MessageDto sendMessage(MessageDto messageDto, String username) {
        chatService.checkChatAccess(messageDto.getChatId(), username);

        User sender = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Sender not found"));

        try {
            Integer messageId = jdbcMessageRepository.sendMessage(
                    messageDto.getChatId(), sender.getId(), messageDto.getContent()
            );
            messageDto.setId(messageId);
            if (messageDto.getMediaList() != null && !messageDto.getMediaList().isEmpty()) {
                for (MediaDto media : messageDto.getMediaList()) {
                    if (media.getUrl() == null || media.getType() == null) continue;
                    mediaService.saveMediaWithUrl(
                            sender.getId(),
                            messageId,
                            "MESSAGE",
                            media.getType(),
                            media.getUrl(),
                            null // metadata
                    );
                }
            }
            messageDto.setSenderId(sender.getId());
            messageDto.setCreatedAt(Instant.now());

            messageQueueService.queueAndSendMessage(messageDto);

            List<ChatMember> members = chatMemberRepository.findByChatId(messageDto.getChatId());
            for (ChatMember member : members) {
                if (!member.getUser().getId().equals(sender.getId()) && !member.getStatus()) {
                    member.setStatus(true);
                    member.setJoinedAt(Instant.now());
                    chatMemberRepository.save(member);
                    ChatDto chatDto = chatService.convertToDto(chatRepository.findById(messageDto.getChatId()).orElseThrow(), member.getUser().getId());
                    messagingTemplate.convertAndSend("/topic/chats/" + member.getUser().getId(), chatDto);
                }
            }

            // Kiểm tra xem sender có bị đánh dấu spam bởi người nhận không
            for (ChatMember member : members) {
                if (!member.getUser().getId().equals(sender.getId())) {
                    ChatMember senderMember = chatMemberRepository.findByChatIdAndUserId(messageDto.getChatId().intValue(), sender.getId())
                            .orElseThrow(() -> new IllegalArgumentException("Sender not found in chat"));
                    if (senderMember.getIsSpam()) {
                        // Gửi tin nhắn đến topic spam-messages
                        messagingTemplate.convertAndSend("/topic/spam-messages/" + messageDto.getChatId(), messageDto);
                        System.out.println("Sent spam message to /topic/spam-messages/" + messageDto.getChatId() + " for userId: " + member.getUser().getId());
                    } else {
                        // Gửi tin nhắn đến topic messages thông thường
                        messagingTemplate.convertAndSend("/topic/messages/" + member.getUser().getId(), messageDto);
                        int updatedUnreadCount = messageStatusRepository.countUnreadChatsByUserId(member.getUser().getId());
                        messagingTemplate.convertAndSend("/topic/unread-count/" + member.getUser().getId(), Map.of("unreadCount", updatedUnreadCount));
                        System.out.println("Sent unread chat count to /topic/unread-count/" + member.getUser().getId() + ": " + updatedUnreadCount);
                    }
                }
            }

            return messageDto;
        } catch (Exception e) {
            System.err.println("Error sending message: " + e.getMessage());
            throw new RuntimeException("Failed to send message: " + e.getMessage());
        }
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

        Instant joinedAt = chatMember.getJoinedAt();

        // Đánh dấu đã đọc
        messageStatusRepository.markAllAsReadByChatIdAndUserId(chatId, user.getId());
        int updatedUnreadCount = messageStatusRepository.countUnreadChatsByUserId(user.getId());
        messagingTemplate.convertAndSend("/topic/unread-count/" + user.getId(), Map.of("unreadCount", updatedUnreadCount));

        // Lấy tất cả message sau thời điểm joinedAt
        List<Message> messages = messageRepository.findByChatId(chatId).stream()
                .filter(msg -> msg.getCreatedAt().isAfter(joinedAt))
                .collect(Collectors.toList());

        // Lấy danh sách messageId
        List<Integer> messageIds = messages.stream()
                .map(Message::getId)
                .collect(Collectors.toList());

        // Map messageId -> List<MediaDto>
        Map<Integer, List<MediaDto>> mediaMap = mediaService.getMediaByTargetIds(messageIds, "MESSAGE", null, true);

        // Gộp vào MessageDto
        return messages.stream()
                .map(msg -> new MessageDto(
                        msg.getId(),
                        msg.getChat().getId(),
                        msg.getSender().getId(),
                        msg.getContent(),
                        msg.getType().getId(),
                        msg.getCreatedAt(),
                        mediaMap.getOrDefault(msg.getId(), List.of())
                ))
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

    @Transactional
    public MessageDto sendMessageWithMedia(Integer chatId, Integer senderId, String content, List<MultipartFile> files) {
        // ✅ Validate user
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new IllegalArgumentException("Người gửi không tồn tại"));

        // ✅ Upload và phân loại media
        List<MediaDto> uploadedMediaList = new ArrayList<>();
        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                mediaService.validateFileTypeByTarget("MESSAGE", file);
                try {
                    String url = gcsService.uploadFile(file);
                    String contentType = file.getContentType();
                    if (contentType == null) throw new IllegalArgumentException("Không xác định loại media");

                    String type;
                    if (contentType.startsWith("image/")) type = "image";
                    else if (contentType.startsWith("video/")) type = "video";
                    else if (contentType.startsWith("audio/")) type = "audio";
                    else throw new IllegalArgumentException("Media không hợp lệ: " + contentType);

                    uploadedMediaList.add(new MediaDto(null, url, type, null, "MESSAGE", true));
                } catch (IOException e) {
                    throw new RuntimeException("Lỗi khi upload media", e);
                }
            }
        }

        // ✅ Tạo message
        Integer messageId = jdbcMessageRepository.sendMessage(chatId, senderId, content);

        // ✅ Lưu media sau khi đã tạo message
        for (MediaDto media : uploadedMediaList) {
            mediaService.saveMediaWithUrl(
                    senderId,
                    messageId,
                    "MESSAGE",
                    media.getType(),
                    media.getUrl(),
                    null
            );
        }

        // ✅ Tạo MessageDto để gửi realtime
        MessageDto dto = new MessageDto(messageId, chatId, senderId, content, null, Instant.now(), uploadedMediaList);

        // ✅ Đưa vào hàng đợi gửi + gửi WebSocket nếu cần
        messageQueueService.queueAndSendMessage(dto);

        // ✅ Gửi WebSocket đến các thành viên khác
        List<ChatMember> members = chatMemberRepository.findByChatId(chatId);
        for (ChatMember member : members) {
            if (!member.getUser().getId().equals(senderId)) {
                messagingTemplate.convertAndSend("/topic/messages/" + member.getUser().getId(), dto);

                int unreadCount = messageStatusRepository.countUnreadChatsByUserId(member.getUser().getId());
                messagingTemplate.convertAndSend("/topic/unread-count/" + member.getUser().getId(), Map.of("unreadCount", unreadCount));
            }
        }

        return dto;
    }
}
