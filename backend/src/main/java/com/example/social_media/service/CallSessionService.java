package com.example.social_media.service;

import com.example.social_media.dto.message.SignalMessageDto;
import com.example.social_media.entity.CallSession;
import com.example.social_media.entity.Chat;
import com.example.social_media.entity.User;
import com.example.social_media.exception.UnauthorizedException;
import com.example.social_media.repository.CallSessionRepository;
import com.example.social_media.repository.ChatRepository;
import com.example.social_media.repository.UserRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class CallSessionService {

    private final CallSessionRepository callSessionRepository;
    private final ChatRepository chatRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ChatService chatService;

    public CallSessionService(CallSessionRepository callSessionRepository, ChatRepository chatRepository,
                              UserRepository userRepository, SimpMessagingTemplate messagingTemplate,
                              ChatService chatService) {
        this.callSessionRepository = callSessionRepository;
        this.chatRepository = chatRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
        this.chatService = chatService;
    }

    @Transactional
    public CallSession startCall(Integer chatId, String username) {
        chatService.checkChatAccess(chatId, username);
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new IllegalArgumentException("Chat not found"));
        User host = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        CallSession callSession = new CallSession();
        callSession.setChat(chat);
        callSession.setHost(host);
        callSession.setStartTime(Instant.now());
        callSession.setStatus(true);
        return callSessionRepository.save(callSession);
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
        messagingTemplate.convertAndSend("/topic/call/" + callSession.getChat().getId(), new SignalMessageDto(callSession.getChat().getId(), "end", null, null, callSession.getHost().getId()));
    }

    @Transactional
    public void handleSignal(SignalMessageDto signalMessage, String username) {
        chatService.checkChatAccess(signalMessage.getChatId(), username);
        messagingTemplate.convertAndSend("/topic/call/" + signalMessage.getChatId(), signalMessage);
    }
}