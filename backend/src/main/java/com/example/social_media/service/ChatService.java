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
        System.out.println("Starting createChat for username: " + username + ", targetUserId: " + targetUserId);
        User currentUser = userDetailsService.getUserByUsername(username);
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + targetUserId));
        System.out.println("Found currentUser: " + currentUser.getDisplayName() + ", targetUser: " + targetUser.getDisplayName());


        // Kiểm tra chat 1-1 đã tồn tại
        List<ChatMember> targetUserChats = chatMemberRepository.findByUserId(targetUser.getId());
        for (ChatMember cm : targetUserChats) {
            List<ChatMember> members = chatMemberRepository.findByChatId(cm.getChat().getId());
            if (members.stream().anyMatch(m -> m.getUser().getId().equals(currentUser.getId())) &&
                    members.size() == 2 && !cm.getChat().getIsGroup()) {
                Chat existingChat = cm.getChat();
                System.out.println("Found existing chat: ID=" + existingChat.getId());


                // Khôi phục ChatMember cho currentUser với status=true và joinedAt mới
                ChatMember existingMember = chatMemberRepository.findByChatIdAndUserId(existingChat.getId(), currentUser.getId())
                        .orElse(null);
                if (existingMember == null) {
                    ChatMember newMember = new ChatMember();
                    ChatMemberId memberId = new ChatMemberId();
                    memberId.setChatId(existingChat.getId());
                    memberId.setUserId(currentUser.getId());
                    newMember.setId(memberId);
                    newMember.setChat(existingChat);
                    newMember.setUser(currentUser);
                    newMember.setJoinedAt(Instant.now());
                    newMember.setStatus(true);
                    newMember.setIsAdmin(false);
                    newMember.setIsSpam(false);
                    try {
                        chatMemberRepository.saveAndFlush(newMember);
                        System.out.println("Restored ChatMember for userId: " + currentUser.getId() + ", chatId: " + existingChat.getId() + ", status=true");
                    } catch (Exception e) {
                        System.err.println("Error restoring ChatMember: " + e.getMessage());
                        throw new RuntimeException("Failed to restore ChatMember due to: " + e.getMessage(), e);
                    }
                } else if (!existingMember.getStatus()) {
                    existingMember.setStatus(true);
                    existingMember.setJoinedAt(Instant.now()); // Cập nhật joinedAt để lọc tin nhắn
                    chatMemberRepository.saveAndFlush(existingMember);
                    System.out.println("Updated ChatMember status to true for userId: " + currentUser.getId() + ", chatId: " + existingChat.getId());
                }
                return convertToDto(existingChat, currentUser.getId());
            }
        }


        // Tạo chat mới nếu không tìm thấy
        Chat chat = new Chat();
        chat.setIsGroup(false);
        String chatName = "Chat_" + Math.min(currentUser.getId(), targetUser.getId()) + "_" + Math.max(currentUser.getId(), targetUser.getId());
        if (chatName == null || chatName.trim().isEmpty()) {
            throw new IllegalArgumentException("Chat name cannot be null or empty");
        }
        if (chatName.length() > 100) chatName = chatName.substring(0, 100);
        chat.setName(chatName);
        chat.setCreatedAt(Instant.now());
        chat.setStatus(true);
        System.out.println("Chat object before save: " + chat);
        System.out.println("Chat name in DB: " + chatName);


        Chat savedChat;
        try {
            savedChat = chatRepository.save(chat);
            entityManager.flush();
            savedChat = entityManager.find(Chat.class, savedChat.getId());
            System.out.println("Saved Chat: " + savedChat + ", id: " + savedChat.getId());
            if (savedChat.getId() == null) {
                throw new IllegalStateException("Chat ID is null after flush. Possible database issue.");
            }
        } catch (Exception e) {
            System.err.println("Error during save and flush Chat: " + e.getMessage());
            throw new RuntimeException("Failed to save Chat due to: " + e.getMessage(), e);
        }


        ChatMember member1 = new ChatMember();
        ChatMemberId member1Id = new ChatMemberId();
        member1Id.setChatId(savedChat.getId());
        member1Id.setUserId(currentUser.getId());
        member1.setId(member1Id);
        member1.setChat(savedChat);
        member1.setUser(currentUser);
        member1.setJoinedAt(Instant.now());
        member1.setStatus(true);
        member1.setIsAdmin(false);
        member1.setIsSpam(false);


        ChatMember member2 = new ChatMember();
        ChatMemberId member2Id = new ChatMemberId();
        member2Id.setChatId(savedChat.getId());
        member2Id.setUserId(targetUser.getId());
        member2.setId(member2Id);
        member2.setChat(savedChat);
        member2.setUser(targetUser);
        member2.setJoinedAt(Instant.now());
        member2.setStatus(true);
        member2.setIsAdmin(false);
        member2.setIsSpam(false);


        try {
            chatMemberRepository.saveAndFlush(member1);
            chatMemberRepository.saveAndFlush(member2);
            System.out.println("Saved ChatMembers for Chat id: " + savedChat.getId());
        } catch (Exception e) {
            System.err.println("Error during saveAndFlush ChatMember: " + e.getMessage());
            throw new RuntimeException("Failed to save ChatMember due to: " + e.getMessage(), e);
        }


        ChatDto chatDto = convertToDto(savedChat, currentUser.getId());
        System.out.println("Returning ChatDto for currentUser: ID=" + chatDto.getId() + ", Name=" + chatDto.getName());
        return chatDto;
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
