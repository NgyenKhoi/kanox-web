package com.example.social_media.service;

import com.example.social_media.dto.message.ChatDto;
import com.example.social_media.entity.Chat;
import com.example.social_media.entity.ChatMember;
import com.example.social_media.entity.Message;
import com.example.social_media.entity.User;
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
        User currentUser = userDetailsService.getUserByUsername(username);
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + targetUserId));

        // Check if chat already exists between these users
        List<ChatMember> existingChats = chatMemberRepository.findByUserId(currentUser.getId());
        for (ChatMember cm : existingChats) {
            if (!cm.getChat().getIsGroup() && chatMemberRepository.existsByChatIdAndUserUsername(cm.getChat().getId(), targetUser.getUsername())) {
                return convertToDto(cm.getChat());
            }
        }

        // Create new chat
        Chat chat = new Chat();
        chat.setIsGroup(false);
        chat.setName(currentUser.getUsername() + " - " + targetUser.getUsername());
        chat.setCreatedAt(Instant.now());
        chat.setStatus(true);
        chatRepository.save(chat);

        // Add members
        ChatMember member1 = new ChatMember();
        member1.setChat(chat);
        member1.setUser(currentUser);
        member1.setJoinedAt(Instant.now());
        member1.setStatus(true);

        ChatMember member2 = new ChatMember();
        member2.setChat(chat);
        member2.setUser(targetUser);
        member2.setJoinedAt(Instant.now());
        member2.setStatus(true);

        chatMemberRepository.save(member1);
        chatMemberRepository.save(member2);

        return convertToDto(chat);
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