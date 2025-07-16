package com.example.social_media.repository.message;

import com.example.social_media.entity.MessageStatus;
import com.example.social_media.entity.MessageStatusId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface MessageStatusRepository extends JpaRepository<MessageStatus, MessageStatusId> {

    @Query("SELECT COUNT(ms) FROM MessageStatus ms WHERE ms.id.userId = :userId AND ms.status = 'unread'")
    int countUnreadByUserId(@Param("userId") Integer userId);

    @Query("SELECT ms FROM MessageStatus ms WHERE ms.message.chat.id = :chatId AND ms.id.userId = :userId AND ms.status = 'unread'")
    List<MessageStatus> findByMessageChatIdAndUserId(@Param("chatId") Integer chatId, @Param("userId") Integer userId);

    @Query("SELECT COUNT(ms) FROM MessageStatus ms WHERE ms.message.chat.id = :chatId AND ms.id.userId = :userId AND ms.status = 'unread'")
    int countUnreadByChatIdAndUserId(@Param("chatId") Integer chatId, @Param("userId") Integer userId);

    @Query("""
                SELECT COUNT(DISTINCT ms.message.chat.id)
                FROM MessageStatus ms
                WHERE ms.id.userId = :userId AND ms.status = 'unread'
            """)
    int countUnreadChatsByUserId(@Param("userId") Integer userId);

    @Modifying
    @Transactional
    @Query("UPDATE MessageStatus ms SET ms.status = 'read' WHERE ms.message.chat.id = :chatId AND ms.id.userId = :userId AND ms.status = 'unread'")
    void markAllAsReadByChatIdAndUserId(@Param("chatId") Integer chatId, @Param("userId") Integer userId);

}