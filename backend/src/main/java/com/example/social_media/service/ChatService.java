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

    @Autowired
    private MessageStatusRepository messageStatusRepository;

    @Transactional
    public ChatDto createChat(String username, Integer targetUserId) {
        if (username == null || username.trim().isEmpty()) {
            throw new SecurityException("Authentication required: No valid username provided");
        }

        User currentUser = userDetailsService.getUserByUsername(username);
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + targetUserId));

        // Kiểm tra chat 1-1 đã tồn tại
        List<ChatMember> targetUserChats = chatMemberRepository.findByUserId(targetUser.getId());
        for (ChatMember cm : targetUserChats) {
            Chat chat = cm.getChat();
            List<ChatMember> members = chatMemberRepository.findByChatId(chat.getId());

            if (members.stream().anyMatch(m -> m.getUser().getId().equals(currentUser.getId())) &&
                    members.size() == 2 && !chat.getIsGroup()) {

                // Khôi phục ChatMember nếu bị ẩn
                ChatMember existingMember = chatMemberRepository.findByChatIdAndUserId(chat.getId(), currentUser.getId())
                        .orElse(null);

                if (existingMember == null) {
                    ChatMember newMember = new ChatMember();
                    ChatMemberId memberId = new ChatMemberId();
                    memberId.setChatId(chat.getId());
                    memberId.setUserId(currentUser.getId());
                    newMember.setId(memberId);
                    newMember.setChat(chat);
                    newMember.setUser(currentUser);
                    newMember.setJoinedAt(Instant.now());
                    newMember.setStatus(true);
                    newMember.setIsAdmin(false);
                    newMember.setIsSpam(false);
                    chatMemberRepository.saveAndFlush(newMember);
                } else if (!existingMember.getStatus()) {
                    existingMember.setStatus(true);
                    existingMember.setJoinedAt(Instant.now());
                    chatMemberRepository.saveAndFlush(existingMember);
                }

                return convertToDto(chat, currentUser.getId());
            }
        }

        // Tạo chat mới
        Chat chat = new Chat();
        chat.setIsGroup(false);
        String chatName = "Chat_" + Math.min(currentUser.getId(), targetUser.getId()) + "_" + Math.max(currentUser.getId(), targetUser.getId());
        chat.setName(chatName.length() > 100 ? chatName.substring(0, 100) : chatName);
        chat.setCreatedAt(Instant.now());
        chat.setStatus(true);

        Chat savedChat = chatRepository.saveAndFlush(chat); // Phải flush để lấy ID

        // ChatMember 1 (current user)
        ChatMember member1 = new ChatMember();
        ChatMemberId id1 = new ChatMemberId();
        id1.setChatId(savedChat.getId());
        id1.setUserId(currentUser.getId());
        member1.setId(id1);
        member1.setChat(savedChat);
        member1.setUser(currentUser);
        member1.setJoinedAt(Instant.now());
        member1.setStatus(true);
        member1.setIsAdmin(false);
        member1.setIsSpam(false);

        // ChatMember 2 (target user)
        ChatMember member2 = new ChatMember();
        ChatMemberId id2 = new ChatMemberId();
        id2.setChatId(savedChat.getId());
        id2.setUserId(targetUser.getId());
        member2.setId(id2);
        member2.setChat(savedChat);
        member2.setUser(targetUser);
        member2.setJoinedAt(Instant.now());
        member2.setStatus(true);
        member2.setIsAdmin(false);
        member2.setIsSpam(false);

        chatMemberRepository.saveAndFlush(member1);
        chatMemberRepository.saveAndFlush(member2);

        return convertToDto(savedChat, currentUser.getId());
    }


    @Transactional(readOnly = true)
    public List<ChatDto> getChats(String username) {
        User user = userDetailsService.getUserByUsername(username);
        List<ChatDto> chats = chatMemberRepository.findByUserId(user.getId()).stream()
                .filter(cm -> cm.getStatus())
                .map(cm -> convertToDto(cm.getChat(), user.getId()))
                .collect(Collectors.toList());
        System.out.println("Returning chats for user " + username + ": count=" + chats.size());
        return chats;
    }

    @Transactional(readOnly = true)
    public ChatDto getChatById(Integer chatId, String username) {
        User user = userDetailsService.getUserByUsername(username);
        ChatMember chatMember = chatMemberRepository.findByChatIdAndUserId(chatId, user.getId())
                .orElseThrow(() -> new UnauthorizedException("You are not a member of this chat."));
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new IllegalArgumentException("Chat not found: " + chatId));
        return convertToDto(chat, user.getId());
    }

    @Transactional(readOnly = true)
    public void checkChatAccess(Integer chatId, String username) {
        if (!chatMemberRepository.existsByChatIdAndUserUsername(chatId, username)) {
            throw new UnauthorizedException("You are not a member of this chat.");
        }
    }

    @Transactional
    public void deleteChat(Integer chatId, String username) {
        User user = userDetailsService.getUserByUsername(username);
        ChatMember chatMember = chatMemberRepository.findByChatIdAndUserId(chatId, user.getId())
                .orElseThrow(() -> new UnauthorizedException("You are not a member of this chat."));
        System.out.println("Deleting chat for user: " + username + ", chatId: " + chatId);
        chatMember.setStatus(false); // Đánh dấu status=false
        chatMemberRepository.saveAndFlush(chatMember);
        System.out.println("Marked ChatMember as deleted for chatId: " + chatId + ", userId: " + user.getId());
    }

    public ChatDto convertToDto(Chat chat, Integer currentUserId) {
        Message lastMessage = messageRepository.findTopByChatIdOrderByCreatedAtDesc(chat.getId())
                .orElse(null);
        String recipientName = chatMemberRepository.findByChatId(chat.getId()).stream()
                .filter(cm -> !cm.getUser().getId().equals(currentUserId))
                .findFirst()
                .map(cm -> cm.getUser().getDisplayName())
                .orElse(chat.getName());
        int unreadMessagesCount = messageStatusRepository.countUnreadByChatIdAndUserId(chat.getId(), currentUserId);
        System.out.println("convertToDto: Chat ID=" + chat.getId() + ", Current User ID=" + currentUserId +
                ", Recipient Name=" + recipientName +
                ", Last Message=" + (lastMessage != null ? lastMessage.getContent() : "null") +
                ", Unread Messages Count=" + unreadMessagesCount);
        return new ChatDto(
                chat.getId(),
                recipientName,
                lastMessage != null ? lastMessage.getContent() : "",
                unreadMessagesCount
        );
    }

    @Transactional(readOnly = true)
    public int countUnreadByChatIdAndUserId(Integer chatId, Integer userId) {
        return messageStatusRepository.countUnreadByChatIdAndUserId(chatId, userId);
    }
}