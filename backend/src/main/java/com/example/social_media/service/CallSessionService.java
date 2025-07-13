package com.example.social_media.service;

import com.example.social_media.dto.message.SignalMessageDto;
import com.example.social_media.entity.CallSession;
import com.example.social_media.entity.Chat;
import com.example.social_media.entity.ChatMember;
import com.example.social_media.entity.User;
import com.example.social_media.exception.UnauthorizedException;
import com.example.social_media.repository.CallSessionRepository;
import com.example.social_media.repository.ChatMemberRepository;
import com.example.social_media.repository.ChatRepository;
import com.example.social_media.repository.UserRepository;
import org.springframework.data.elasticsearch.ResourceNotFoundException;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class CallSessionService {
    private final CallSessionRepository callSessionRepository;
    private final ChatRepository chatRepository;
    private final UserRepository userRepository;
    private final ChatService chatService;
    private final ChatMemberRepository chatMemberRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public CallSessionService(CallSessionRepository callSessionRepository, ChatRepository chatRepository,
                              UserRepository userRepository, ChatService chatService,
                              ChatMemberRepository chatMemberRepository, SimpMessagingTemplate messagingTemplate) {
        this.callSessionRepository = callSessionRepository;
        this.chatRepository = chatRepository;
        this.userRepository = userRepository;
        this.chatService = chatService;
        this.chatMemberRepository = chatMemberRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public CallSession startCall(Integer chatId, String username) {
        System.out.println("Starting call for chatId: " + chatId + ", username: " + username);
        try {
            chatService.checkChatAccess(chatId, username);
            Chat chat = chatRepository.findById(chatId)
                    .orElseThrow(() -> new ResourceNotFoundException("Chat not found"));
            User host = userRepository.findByUsername(username)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));

            List<ChatMember> members = chatMemberRepository.findByChatId(chatId);

            CallSession callSession = new CallSession();
            callSession.setChat(chat);
            callSession.setHost(host);
            callSession.setStartTime(Instant.now());
            callSession.setStatus(true);
            callSession = callSessionRepository.save(callSession);

            for (ChatMember member : members) {
                if (!member.getUser().getId().equals(host.getId()) && !member.getIsSpam()) {
                    messagingTemplate.convertAndSend("/topic/call/" + chatId,
                            new SignalMessageDto(chatId, "start", null, null, host.getId()));
                    System.out.println("Sent call start signal to userId: " + member.getUser().getId());
                } else if (member.getIsSpam()) {
                    System.out.println("Skipped call start signal for userId: " + member.getUser().getId() + " (marked as spam)");
                }
            }

            return callSession;
        } catch (Exception e) {
            System.err.println("Error in startCall: " + e.getMessage());
            throw new RuntimeException("Lỗi hệ thống: " + e.getMessage(), e);
        }
    }

    @Transactional
    public void endCall(Integer callSessionId, String username) {
        CallSession callSession = callSessionRepository.findById(callSessionId)
                .orElseThrow(() -> new IllegalArgumentException("Call session not found"));
        if (!callSession.getHost().getUsername().equals(username)) {
            throw new UnauthorizedException("Only the host can end the call.");
        }
        callSession.setEndTime(Instant.now());
        callSession.setStatus(false);
        callSessionRepository.save(callSession);
        System.out.println("Call ended for chatId: " + callSession.getChat().getId());

        messagingTemplate.convertAndSend("/topic/call/" + callSession.getChat().getId(),
                new SignalMessageDto(callSession.getChat().getId(), "end", null, null, null));
    }
}