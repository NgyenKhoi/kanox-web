package com.example.social_media.repository;

import com.example.social_media.entity.CallSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CallSessionRepository extends JpaRepository<CallSession, Integer> {

    @Query("SELECT cs FROM CallSession cs WHERE cs.chat.id = :chatId AND cs.status = true")
    Optional<CallSession> findActiveByChatId(@Param("chatId") Integer chatId);
}