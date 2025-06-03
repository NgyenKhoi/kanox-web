package com.example.social_media.repository;

import com.example.social_media.entity.ChatMember;
import com.example.social_media.entity.ChatMemberId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatMemberRepository extends JpaRepository<ChatMember, ChatMemberId> {
    boolean existsByChatIdAndUserUsername(Integer chatId, String username);
}