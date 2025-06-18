package com.example.social_media.service;

import com.example.social_media.dto.message.ChatDto;
import com.example.social_media.entity.*;
import com.example.social_media.exception.UnauthorizedException;
import com.example.social_media.repository.ChatMemberRepository;
import com.example.social_media.repository.ChatRepository;
import com.example.social_media.repository.MessageRepository;
import com.example.social_media.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatService {

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

    @Transactional
    public ChatDto createChat(String username, Integer targetUserId) {
        if (username == null || username.trim().isEmpty()) {
            throw new SecurityException("Authentication required: No valid username provided");
        }
        System.out.println("Starting createChat for username: " + username + ", targetUserId: " + targetUserId);
        User currentUser = userDetailsService.getUserByUsername(username);
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + targetUserId));
        System.out.println("Found currentUser: " + currentUser.getDisplayName() + ", targetUser: " + targetUser.getDisplayName());

        Chat chat = new Chat();
        chat.setIsGroup(false);
        String chatName = currentUser.getUsername() + " - " + targetUser.getUsername();
        if (chatName == null || chatName.trim().isEmpty()) {
            throw new IllegalArgumentException("Chat name cannot be null or empty");
        }
        if (chatName.length() > 100) chatName = chatName.substring(0, 100);
        chat.setName(chatName);
        chat.setCreatedAt(Instant.now());
        chat.setStatus(true);
        System.out.println("Chat object before save: " + chat);
        System.out.println("Chat name: " + chatName);

        Chat savedChat;
        try {
            savedChat = chatRepository.save(chat);
            entityManager.flush(); // Đảm bảo flush
            savedChat = entityManager.find(Chat.class, savedChat.getId()); // Tải lại để xác nhận id
            System.out.println("Saved Chat: " + savedChat + ", id: " + savedChat.getId());
            if (savedChat.getId() == null) {
                throw new IllegalStateException("Chat ID is null after flush. Possible database issue.");
            }
        } catch (Exception e) {
            System.err.println("Error during save and flush Chat: " + e.getMessage());
            throw new RuntimeException("Failed to save Chat due to: " + e.getMessage(), e);
        }

        // Tạo và lưu ChatMember
        ChatMember member1 = new ChatMember();
        ChatMemberId member1Id = new ChatMemberId();
        member1Id.setChatId(savedChat.getId());
        member1Id.setUserId(currentUser.getId());
        member1.setId(member1Id);
        member1.setChat(savedChat);
        member1.setUser(currentUser);
        member1.setJoinedAt(Instant.now());
        member1.setStatus(true);

        ChatMember member2 = new ChatMember();
        ChatMemberId member2Id = new ChatMemberId();
        member2Id.setChatId(savedChat.getId());
        member2Id.setUserId(targetUser.getId());
        member2.setId(member2Id);
        member2.setChat(savedChat);
        member2.setUser(targetUser);
        member2.setJoinedAt(Instant.now());
        member2.setStatus(true);

        try {
            chatMemberRepository.saveAndFlush(member1);
            chatMemberRepository.saveAndFlush(member2);
            System.out.println("Saved ChatMembers for Chat id: " + savedChat.getId());
        } catch (Exception e) {
            System.err.println("Error during saveAndFlush ChatMember: " + e.getMessage());
            throw new RuntimeException("Failed to save ChatMember due to: " + e.getMessage(), e);
        }

        return convertToDto(savedChat);
    }

    @Transactional(readOnly = true)
    public List<ChatDto> getChats(String username) {
        User user = userDetailsService.getUserByUsername(username);
        return chatMemberRepository.findByUserId(user.getId()).stream()
                .map(cm -> {
                    Chat chat = cm.getChat();
                    Message lastMessage = messageRepository.findTopByChatIdOrderByCreatedAtDesc(chat.getId())
                            .orElse(null);
                    return new ChatDto(
                            chat.getId(),
                            chat.getName(),
                            lastMessage != null ? lastMessage.getContent() : ""
                    );
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public void checkChatAccess(Integer chatId, String username) {
        if (!chatMemberRepository.existsByChatIdAndUserUsername(chatId, username)) {
            throw new UnauthorizedException("You are not a member of this chat.");
        }
    }

    private ChatDto convertToDto(Chat chat) {
        Message lastMessage = messageRepository.findTopByChatIdOrderByCreatedAtDesc(chat.getId())
                .orElse(null);
        return new ChatDto(
                chat.getId(),
                chat.getName(),
                lastMessage != null ? lastMessage.getContent() : ""
        );
    }
}