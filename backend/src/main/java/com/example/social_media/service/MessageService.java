package com.example.social_media.service;

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

//    @Transactional
//    public MessageDto sendMessage(MessageDto messageDto, String username) {
//        chatService.checkChatAccess(messageDto.getChatId().intValue(), username);
//
//        MessageType messageType = messageTypeRepository.findById(messageDto.getTypeId())
//                .orElseThrow(() -> new IllegalArgumentException("Invalid message type"));
//
//        Chat chat = chatRepository.findById(messageDto.getChatId().intValue())
//                .orElseThrow(() -> new IllegalArgumentException("Chat not found"));
//
//        User sender = userRepository.findById(messageDto.getSenderId().intValue())
//                .orElseThrow(() -> new IllegalArgumentException("Sender not found"));
//
//        // Khôi phục ChatMember.status của người nhận nếu status=false
//        List<ChatMember> members = chatMemberRepository.findByChatId(messageDto.getChatId().intValue());
//        for (ChatMember member : members) {
//            if (!member.getUser().getId().equals(sender.getId()) && !member.getStatus()) {
//                member.setStatus(true);
//                member.setJoinedAt(Instant.now());
//                chatMemberRepository.save(member);
//                ChatDto chatDto = chatService.convertToDto(chat, member.getUser().getId());
//                messagingTemplate.convertAndSend("/topic/chats/" + member.getUser().getId(), chatDto);
//            }
//        }
//
//        Message message = new Message();
//        message.setChat(chat);
//        message.setSender(sender);
//        message.setContent(messageDto.getContent());
//        message.setType(messageType);
//        message.setCreatedAt(Instant.now());
//        message = messageRepository.save(message);
//
//        messageDto.setId(message.getId());
//        messageDto.setCreatedAt(message.getCreatedAt());
//        messageQueueService.queueAndSendMessage(messageDto);
//
//        for (ChatMember member : members) {
//            if (!member.getUser().getId().equals(sender.getId())) {
//                MessageStatus status = new MessageStatus();
//                status.setId(new MessageStatusId(message.getId(), member.getUser().getId()));
//                status.setMessage(message);
//                status.setUser(member.getUser());
//                status.setStatus("unread");
//                status.setCreatedAt(Instant.now());
//                messageStatusRepository.save(status);
//                int updatedUnreadCount = messageStatusRepository.countUnreadChatsByUserId(member.getUser().getId());
//                messagingTemplate.convertAndSend("/topic/unread-count/" + member.getUser().getId(), Map.of("unreadCount", updatedUnreadCount));
//                System.out.println("Sent unread chat count to /topic/unread-count/" + member.getUser().getId() + ": " + updatedUnreadCount);
//            }
//        }
//
//        for (ChatMember member : members) {
//            if (!member.getUser().getId().equals(sender.getId())) {
//                messagingTemplate.convertAndSend("/topic/messages/" + member.getUser().getId(), messageDto);
//            }
//        }
//
//        return messageDto;
//    }

    @Transactional
    public MessageDto sendMessage(MessageDto messageDto, String username) {
        chatService.checkChatAccess(messageDto.getChatId(), username);

        User sender = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Sender not found"));

        try {
            Map<String, Object> result = jdbcTemplate.queryForMap(
                    "DECLARE @new_message_id INT; " +
                            "EXEC sp_SendMessage @chat_id = ?, @sender_id = ?, @content = ?, @media_url = ?, @media_type = ?, @new_message_id = @new_message_id OUTPUT; " +
                            "SELECT @new_message_id AS new_message_id, created_at FROM tblMessage WHERE id = @new_message_id;",
                    messageDto.getChatId(), sender.getId(), messageDto.getContent(), null, null);

            Integer newMessageId = (Integer) result.get("new_message_id");
            Instant createdAt = ((java.sql.Timestamp) result.get("created_at")).toInstant();
            messageDto.setId(newMessageId);
            messageDto.setSenderId(sender.getId());
            messageDto.setCreatedAt(createdAt);

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

        // Lấy joinedAt để lọc tin nhắn
        Instant joinedAt = chatMember.getJoinedAt();

        // Đánh dấu tất cả tin nhắn chưa đọc là đã đọc
        messageStatusRepository.markAllAsReadByChatIdAndUserId(chatId, user.getId());
        System.out.println("Marked all messages as read for chatId " + chatId + " and userId " + user.getId());

        // Gửi thông báo cập nhật unread count
        int updatedUnreadCount = messageStatusRepository.countUnreadChatsByUserId(user.getId());
        messagingTemplate.convertAndSend("/topic/unread-count/" + user.getId(), Map.of("unreadCount", updatedUnreadCount));
        System.out.println("Sent unread chat count to /topic/unread-count/" + user.getId() + ": " + updatedUnreadCount);

        // Trả về tin nhắn sau joinedAt
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

    public MessageDto sendMessageWithMedia(Integer chatId, Integer senderId, String content, MultipartFile file) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new IllegalArgumentException("Người gửi không tồn tại"));

        String mediaUrl = null;
        String mediaType = null;

        // ✅ Upload file nếu có
        if (file != null && !file.isEmpty()) {
            mediaService.validateFileTypeByTarget("MESSAGE", file);
            try {
                mediaUrl = gcsService.uploadFile(file);
            } catch (IOException e) {
                throw new RuntimeException("Lỗi khi upload media", e);
            }

            String contentType = file.getContentType();
            if (contentType == null) throw new IllegalArgumentException("Không xác định loại media");

            if (contentType.startsWith("image/")) mediaType = "image";
            else if (contentType.startsWith("video/")) mediaType = "video";
            else if (contentType.startsWith("audio/")) mediaType = "audio";
            else throw new IllegalArgumentException("Media không hợp lệ: " + contentType);
        }

        // ✅ Gọi stored procedure
        Integer newMessageId = jdbcMessageRepository.sendMessage(chatId, senderId, content, mediaUrl, mediaType);

        // ✅ Lưu vào bảng media nếu có media
        if (mediaUrl != null) {
            mediaService.saveMediaWithUrl(senderId, newMessageId, "MESSAGE", mediaType, mediaUrl, null);
        }

        // ✅ Tạo DTO và gửi realtime
        MessageDto dto = new MessageDto();
        dto.setId(newMessageId);
        dto.setChatId(chatId);
        dto.setSenderId(senderId);
        dto.setContent(content);
        dto.setMediaUrl(mediaUrl);
        dto.setMediaType(mediaType);
        dto.setCreatedAt(Instant.now());

        messageQueueService.queueAndSendMessage(dto);

        // ✅ Gửi cho các thành viên khác
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
