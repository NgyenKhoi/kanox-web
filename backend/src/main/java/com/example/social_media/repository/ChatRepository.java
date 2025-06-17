package com.example.social_media.repository;

import com.example.social_media.entity.Chat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatRepository extends JpaRepository<Chat, Integer> {

    @Query("SELECT c FROM Chat c JOIN c.tblChatMembers cm WHERE cm.user.id = :userId AND c.status = true")
    List<Chat> findByUserId(@Param("userId") Integer userId);

    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END FROM Chat c JOIN c.tblChatMembers cm1 JOIN c.tblChatMembers cm2 " +
            "WHERE cm1.user.id = :userId1 AND cm2.user.id = :userId2 AND c.isGroup = false")
    boolean existsPrivateChatBetweenUsers(@Param("userId1") Integer userId1, @Param("userId2") Integer userId2);
}