package com.example.social_media.service;

import com.example.social_media.dto.message.ChatDto;
import com.example.social_media.entity.*;
import com.example.social_media.exception.UnauthorizedException;
import com.example.social_media.repository.ChatMemberRepository;
import com.example.social_media.repository.ChatRepository;
import com.example.social_media.repository.MessageRepository;
import com.example.social_media.repository.MessageStatusRepository;
import com.example.social_media.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private static final Logger logger = LoggerFactory.getLogger(ChatService.class);

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    private ChatRepository chatRepository;

    @Autowired
    private ChatMemberRepository chatMemberRepository;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private MessageStatusRepository messageStatusRepository;

    @Transactional
    public ChatDto createChat(String username, Integer targetUserId) {
        if (username == null || username.trim().isEmpty()) {
            logger.warn("Authentication required: No valid username provided");
            throw new SecurityException("Authentication required: No valid username provided");
        }
        if (targetUserId == null) {
            logger.warn("Target user ID is null");
            throw new IllegalArgumentException("Target user ID is required");
        }

        User currentUser = userDetailsService.getUserByUsername(username);
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> {
                    logger.warn("User not found: userId={}", targetUserId);
                    return new IllegalArgumentException("User not found: " + targetUserId);
                });

        if (!targetUser.getStatus()) {
            logger.warn("Target user is disabled: userId={}", targetUserId);
            throw new IllegalArgumentException("Cannot create chat with a disabled user");
        }

        logger.info("Starting createChat for username: {}, targetUserId: {}", username, targetUserId);

        // Kiểm tra chat 1-1 đã tồn tại
        Optional<Chat> existingChat = chatMemberRepository.findOneToOneChat(currentUser.getId(), targetUser.getId());
        if (existingChat.isPresent()) {
            Chat chat = existingChat.get();
            logger.info("Found existing one-to-one chat: chatId={}", chat.getId());

            // Khôi phục ChatMember nếu bị ẩn
            ChatMember existingMember = chatMemberRepository.findByChatIdAndUserId(chat.getId(), currentUser.getId())
                    .orElse(null);

            if (existingMember == null) {
                logger.info("Creating new ChatMember for userId={} in chatId={}", currentUser.getId(), chat.getId());
                ChatMember newMember = new ChatMember();
                ChatMemberId memberId = new ChatMemberId(chat.getId(), currentUser.getId());
                newMember.setId(memberId);
                newMember.setChat(chat);
                newMember.setUser(currentUser);
                newMember.setJoinedAt(Instant.now());
                newMember.setStatus(true);
                newMember.setIsAdmin(false);
                newMember.setIsSpam(false);
                chatMemberRepository.save(newMember);
            } else if (!existingMember.getStatus()) {
                logger.info("Restoring ChatMember for userId={} in chatId={}", currentUser.getId(), chat.getId());
                existingMember.setStatus(true);
                existingMember.setJoinedAt(Instant.now());
                chatMemberRepository.save(existingMember);
            }

            return convertToDto(chat, currentUser.getId());
        }

        // Tạo chat mới
        logger.info("Creating new one-to-one chat between userId={} and targetUserId={}", currentUser.getId(), targetUserId);
        Chat chat = new Chat();
        chat.setIsGroup(false);
        String chatName = "Chat_" + Math.min(currentUser.getId(), targetUser.getId()) + "_" + Math.max(currentUser.getId(), targetUser.getId());
        chat.setName(chatName.length() > 100 ? chatName.substring(0, 100) : chatName);
        chat.setCreatedAt(Instant.now());
        chat.setStatus(true);

        logger.debug("Chat object before save: {}", chat);
        Chat savedChat;
        try {
            savedChat = chatRepository.save(chat);
            logger.info("Chat saved successfully: chatId={}", savedChat.getId());
        } catch (Exception e) {
            logger.error("Failed to save Chat: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to save Chat: " + e.getMessage(), e);
        }

        if (savedChat.getId() == null) {
            logger.error("Chat ID is null after save: chatName={}", chat.getName());
            throw new IllegalStateException("Failed to generate Chat ID");
        }

        // ChatMember 1 (current user)
        ChatMember member1 = new ChatMember();
        ChatMemberId id1 = new ChatMemberId(savedChat.getId(), currentUser.getId());
        member1.setId(id1);
        member1.setChat(savedChat);
        member1.setUser(currentUser);
        member1.setJoinedAt(Instant.now());
        member1.setStatus(true);
        member1.setIsAdmin(false);
        member1.setIsSpam(false);

        // ChatMember 2 (target user)
        ChatMember member2 = new ChatMember();
        ChatMemberId id2 = new ChatMemberId(savedChat.getId(), targetUser.getId());
        member2.setId(id2);
        member2.setChat(savedChat);
        member2.setUser(targetUser);
        member2.setJoinedAt(Instant.now());
        member2.setStatus(true);
        member2.setIsAdmin(false);
        member2.setIsSpam(false);

        try {
            chatMemberRepository.saveAll(List.of(member1, member2));
            logger.info("ChatMembers saved for chatId={}", savedChat.getId());
        } catch (Exception e) {
            logger.error("Failed to save ChatMembers: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to save ChatMembers: " + e.getMessage(), e);
        }

        return convertToDto(savedChat, currentUser.getId());
    }

    @Transactional(readOnly = true)
    public List<ChatDto> getChats(String username) {
        if (username == null || username.trim().isEmpty()) {
            logger.warn("Invalid username provided for getChats");
            throw new SecurityException("Authentication required: No valid username provided");
        }

        User user = userDetailsService.getUserByUsername(username);
        List<ChatDto> chats = chatMemberRepository.findByUserId(user.getId()).stream()
                .filter(cm -> cm.getStatus() && cm.getChat().getStatus())
                .map(cm -> convertToDto(cm.getChat(), user.getId()))
                .collect(Collectors.toList());
        logger.info("Returning {} chats for user {}", chats.size(), username);
        return chats;
    }

    @Transactional(readOnly = true)
    public ChatDto getChatById(Integer chatId, String username) {
        if (chatId == null || username == null || username.trim().isEmpty()) {
            logger.warn("Invalid input: chatId={}, username={}", chatId, username);
            throw new IllegalArgumentException("Chat ID and username are required");
        }

        User user = userDetailsService.getUserByUsername(username);
        ChatMember chatMember = chatMemberRepository.findByChatIdAndUserId(chatId, user.getId())
                .orElseThrow(() -> {
                    logger.warn("User {} is not a member of chat {}", username, chatId);
                    return new UnauthorizedException("You are not a member of this chat: " + chatId);
                });
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> {
                    logger.warn("Chat not found: chatId={}", chatId);
                    return new IllegalArgumentException("Chat not found: " + chatId);
                });
        if (!chat.getStatus()) {
            logger.warn("Chat is disabled: chatId={}", chatId);
            throw new IllegalArgumentException("Chat is disabled: " + chatId);
        }
        return convertToDto(chat, user.getId());
    }

    @Transactional(readOnly = true)
    public void checkChatAccess(Integer chatId, String username) {
        if (chatId == null || username == null || username.trim().isEmpty()) {
            logger.warn("Invalid input for checkChatAccess: chatId={}, username={}", chatId, username);
            throw new IllegalArgumentException("Chat ID and username are required");
        }
        if (!chatMemberRepository.existsByChatIdAndUserUsernameAndStatusTrue(chatId, username)) {
            logger.warn("User {} is not a member of chat {}", username, chatId);
            throw new UnauthorizedException("You are not a member of this chat: " + chatId);
        }
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> {
                    logger.warn("Chat not found: chatId={}", chatId);
                    return new IllegalArgumentException("Chat not found: " + chatId);
                });
        if (!chat.getStatus()) {
            logger.warn("Chat is disabled: chatId={}", chatId);
            throw new IllegalArgumentException("Chat is disabled: " + chatId);
        }
    }

    @Transactional
    public void deleteChat(Integer chatId, String username) {
        if (chatId == null || username == null || username.trim().isEmpty()) {
            logger.warn("Invalid input for deleteChat: chatId={}, username={}", chatId, username);
            throw new IllegalArgumentException("Chat ID and username are required");
        }

        User user = userDetailsService.getUserByUsername(username);
        ChatMember chatMember = chatMemberRepository.findByChatIdAndUserId(chatId, user.getId())
                .orElseThrow(() -> {
                    logger.warn("User {} is not a member of chat {}", username, chatId);
                    return new UnauthorizedException("You are not a member of this chat: " + chatId);
                });
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> {
                    logger.warn("Chat not found: chatId={}", chatId);
                    return new IllegalArgumentException("Chat not found: " + chatId);
                });
        if (!chat.getStatus()) {
            logger.warn("Chat is already disabled: chatId={}", chatId);
            throw new IllegalArgumentException("Chat is already disabled: " + chatId);
        }

        logger.info("Deleting chat for user: username={}, chatId={}", username, chatId);
        chatMember.setStatus(false);
        chatMemberRepository.save(chatMember);

        // Kiểm tra nếu tất cả ChatMember đều có status=false, vô hiệu hóa Chat
        List<ChatMember> activeMembers = chatMemberRepository.findByChatIdAndStatusTrue(chatId);
        if (activeMembers.isEmpty()) {
            chat.setStatus(false);
            chatRepository.save(chat);
            logger.info("All members left chat, disabled chat: chatId={}", chatId);
        }
    }

    public ChatDto convertToDto(Chat chat, Integer currentUserId) {
        Message lastMessage = messageRepository.findTopByChatIdOrderByCreatedAtDesc(chat.getId())
                .orElse(null);
        Optional<ChatMember> recipient = chatMemberRepository.findByChatId(chat.getId()).stream()
                .filter(cm -> !cm.getUser().getId().equals(currentUserId))
                .findFirst();

        String recipientName = recipient.map(cm -> cm.getUser().getDisplayName()).orElse(chat.getName());
        Integer otherUserId = recipient.map(cm -> cm.getUser().getId()).orElse(null);
        int unreadMessagesCount = messageStatusRepository.countUnreadByChatIdAndUserId(chat.getId(), currentUserId);

        logger.debug("convertToDto: Chat ID={}, Current User ID={}, Recipient Name={}, Other User ID={}, Last Message={}, Unread Messages Count={}",
                chat.getId(), currentUserId, recipientName, otherUserId,
                lastMessage != null ? lastMessage.getContent() : "null", unreadMessagesCount);

        return new ChatDto(
                chat.getId(),
                recipientName,
                lastMessage != null ? lastMessage.getContent() : "",
                unreadMessagesCount
        );
    }

    @Transactional(readOnly = true)
    public int countUnreadByChatIdAndUserId(Integer chatId, Integer userId) {
        if (chatId == null || userId == null) {
            logger.warn("Invalid input for countUnread: chatId={}, userId={}", chatId, userId);
            throw new IllegalArgumentException("Chat ID and user ID are required");
        }
        return messageStatusRepository.countUnreadByChatIdAndUserId(chatId, userId);
    }
}