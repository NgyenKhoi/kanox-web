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
                          MediaService mediaService, GcsService gcsService, JdbcMessageRepository jdbcMessageRepository) {
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
            // Gửi tin nhắn
            Integer messageId = jdbcMessageRepository.sendMessage(
                    messageDto.getChatId(),
                    sender.getId(),
                    messageDto.getContent()
            );
            messageDto.setId(messageId);

            // Lưu media nếu có
            if (messageDto.getMediaList() != null && !messageDto.getMediaList().isEmpty()) {
                for (MediaDto media : messageDto.getMediaList()) {
                    if (media.getUrl() == null || media.getType() == null) continue;
                    mediaService.saveMediaWithUrl(
                            sender.getId(),
                            messageId,
                            "MESSAGE",
                            media.getType(),
                            media.getUrl(),
                            null
                    );
                }
            }

            messageDto.setSenderId(sender.getId());
            messageDto.setCreatedAt(Instant.now());

            messageQueueService.queueAndSendMessage(messageDto);

            // Gửi thông báo đến các thành viên chat
            List<ChatMember> members = chatMemberRepository.findByChatId(messageDto.getChatId());
            for (ChatMember member : members) {
                if (!member.getUser().getId().equals(sender.getId()) && !member.getStatus()) {
                    member.setStatus(true);
                    member.setJoinedAt(Instant.now());
                    chatMemberRepository.save(member);
                    ChatDto chatDto = chatService.convertToDto(
                            chatRepository.findById(messageDto.getChatId()).orElseThrow(),
                            member.getUser().getId()
                    );
                    messagingTemplate.convertAndSend("/topic/chats/" + member.getUser().getId(), chatDto);
                }
            }

            for (ChatMember member : members) {
                if (!member.getUser().getId().equals(sender.getId())) {
                    ChatMember senderMember = chatMemberRepository.findByChatIdAndUserId(
                            messageDto.getChatId(), sender.getId()
                    ).orElseThrow(() -> new IllegalArgumentException("Sender not found in chat"));

                    if (senderMember.getIsSpam()) {
                        messagingTemplate.convertAndSend("/topic/spam-messages/" + messageDto.getChatId(), messageDto);
                    } else {
                        messagingTemplate.convertAndSend("/topic/messages/" + member.getUser().getId(), messageDto);
                        int updatedUnreadCount = messageStatusRepository.countUnreadChatsByUserId(member.getUser().getId());
                        messagingTemplate.convertAndSend("/topic/unread-count/" + member.getUser().getId(), Map.of("unreadCount", updatedUnreadCount));
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
        String mediaUrl = null;
        String mediaType = null;
        List<MediaDto> uploadedMediaList = new ArrayList<>();

        if (files != null && !files.isEmpty()) {
            MultipartFile file = files.get(0); // Chỉ lấy file đầu tiên để lưu qua stored procedure
            mediaService.validateFileTypeByTarget("MESSAGE", file);
            try {
                mediaUrl = gcsService.uploadFile(file);
                String contentType = file.getContentType();
                if (contentType == null) throw new IllegalArgumentException("Không xác định loại media");

                if (contentType.startsWith("image/")) mediaType = "image";
                else if (contentType.startsWith("video/")) mediaType = "video";
                else if (contentType.startsWith("audio/")) mediaType = "audio";
                else throw new IllegalArgumentException("Media không hợp lệ: " + contentType);

                uploadedMediaList.add(new MediaDto(null, mediaUrl, mediaType, null, "MESSAGE", true));

                // Upload các file còn lại (nếu có)
                for (int i = 1; i < files.size(); i++) {
                    MultipartFile additionalFile = files.get(i);
                    mediaService.validateFileTypeByTarget("MESSAGE", additionalFile);
                    String additionalUrl = gcsService.uploadFile(additionalFile);
                    String additionalContentType = additionalFile.getContentType();
                    String additionalMediaType;

                    if (additionalContentType == null) throw new IllegalArgumentException("Không xác định loại media");
                    if (additionalContentType.startsWith("image/")) additionalMediaType = "image";
                    else if (additionalContentType.startsWith("video/")) additionalMediaType = "video";
                    else if (additionalContentType.startsWith("audio/")) additionalMediaType = "audio";
                    else throw new IllegalArgumentException("Media không hợp lệ: " + additionalContentType);

                    uploadedMediaList.add(new MediaDto(null, additionalUrl, additionalMediaType, null, "MESSAGE", true));
                }
            } catch (IOException e) {
                throw new RuntimeException("Lỗi khi upload media", e);
            }
        }

        // ✅ Tạo message
        Integer messageId = jdbcMessageRepository.sendMessage(chatId, senderId, content);

        // ✅ Lưu media còn lại (nếu có)
        for (MediaDto media : uploadedMediaList) {
            if (media.getUrl() == null || media.getType() == null) continue;
            // Chỉ lưu media nếu chưa được lưu trong stored procedure
            if (!media.getUrl().equals(mediaUrl)) {
                mediaService.saveMediaWithUrl(
                        senderId,
                        messageId,
                        "MESSAGE",
                        media.getType(),
                        media.getUrl(),
                        null
                );
            }
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
