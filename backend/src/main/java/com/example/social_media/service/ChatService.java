package com.example.social_media.service;

import com.example.social_media.dto.message.ChatDto;
import com.example.social_media.entity.*;
import com.example.social_media.exception.UnauthorizedException;
import com.example.social_media.repository.ChatMemberRepository;
import com.example.social_media.repository.ChatRepository;
import com.example.social_media.repository.MessageRepository;
import com.example.social_media.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private final ChatRepository chatRepository;
    private final ChatMemberRepository chatMemberRepository;
    private final UserRepository userRepository;
    private final CustomUserDetailsService userDetailsService;
    private final MessageRepository messageRepository;

    public ChatService(ChatRepository chatRepository, ChatMemberRepository chatMemberRepository, UserRepository userRepository, CustomUserDetailsService userDetailsService, MessageRepository messageRepository) {
        this.chatRepository = chatRepository;
        this.chatMemberRepository = chatMemberRepository;
        this.userRepository = userRepository;
        this.userDetailsService = userDetailsService;
        this.messageRepository = messageRepository;
    }

    @Transactional
    public ChatDto createChat(String username, Integer targetUserId) {
        System.out.println("Starting createChat for username: " + username + ", targetUserId: " + targetUserId);
        User currentUser = userDetailsService.getUserByUsername(username);
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + targetUserId));
        System.out.println("Found currentUser: " + currentUser + ", targetUser: " + targetUser);

        // Create new chat
        Chat chat = new Chat();
        chat.setIsGroup(false);
        chat.setName(currentUser.getUsername() + " - " + targetUser.getUsername());
        chat.setCreatedAt(Instant.now());
        chat.setStatus(true);

        // Lưu chat và flush để đảm bảo id được gán
        Chat savedChat = chatRepository.saveAndFlush(chat);
        System.out.println("Saved Chat with id: " + savedChat.getId());
        if (savedChat.getId() == null) {
            throw new IllegalStateException("Chat ID is null after saveAndFlush");
        }

        // Add members
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

        chatMemberRepository.saveAndFlush(member1);
        chatMemberRepository.saveAndFlush(member2);
        System.out.println("Saved ChatMembers for Chat id: " + savedChat.getId());

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