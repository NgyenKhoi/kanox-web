package com.example.social_media.repository;

import com.example.social_media.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<Message, Integer> {
    List<Message> findByChatId(Integer chatId);
    Optional<Message> findTopByChatIdOrderByCreatedAtDesc(Integer chatId);
    @Query("SELECT m FROM Message m WHERE m.chat.id = :chatId AND m.sender.id IN :senderIds")
    List<Message> findByChatIdAndSenderIdIn(@Param("chatId") Integer chatId, @Param("senderIds") List<Integer> senderIds);
}