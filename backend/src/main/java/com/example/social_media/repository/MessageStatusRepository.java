package com.example.social_media.repository;

import com.example.social_media.entity.MessageStatus;
import com.example.social_media.entity.MessageStatusId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MessageStatusRepository extends JpaRepository<MessageStatus, MessageStatusId> {

    @Query("SELECT COUNT(ms) FROM MessageStatus ms WHERE ms.id.userId = :userId AND ms.status = 'unread'")
    int countUnreadByUserId(@Param("userId") Integer userId);

    @Query("SELECT ms FROM MessageStatus ms WHERE ms.message.chat.id = :chatId AND ms.id.userId = :userId AND ms.status = 'unread'")
    List<MessageStatus> findByMessageChatIdAndUserId(@Param("chatId") Integer chatId, @Param("userId") Integer userId);
}