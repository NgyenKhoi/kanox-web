package com.example.social_media.repository;

import com.example.social_media.entity.Chat;
import com.example.social_media.entity.ChatMember;
import com.example.social_media.entity.ChatMemberId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatMemberRepository extends JpaRepository<ChatMember, ChatMemberId> {
    @Query("SELECT cm FROM ChatMember cm WHERE cm.user.id = :userId")
    List<ChatMember> findByUserId(@Param("userId") Integer userId);

    @Query("SELECT CASE WHEN COUNT(cm) > 0 THEN true ELSE false END " +
            "FROM ChatMember cm WHERE cm.chat.id = :chatId AND cm.user.username = :username")
    boolean existsByChatIdAndUserUsername(@Param("chatId") Integer chatId, @Param("username") String username);

    @Query("SELECT cm FROM ChatMember cm WHERE cm.chat.id = :chatId")
    List<ChatMember> findByChatId(@Param("chatId") Integer chatId);

    @Query("SELECT CASE WHEN COUNT(cm) > 0 THEN true ELSE false END " +
            "FROM ChatMember cm WHERE cm.chat.id = :chatId AND cm.user.id = :userId")
    boolean existsByChatIdAndUserId(@Param("chatId") Integer chatId, @Param("userId") Integer userId);

    @Query("SELECT cm FROM ChatMember cm WHERE cm.chat.id = :chatId AND cm.user.id = :userId")
    Optional<ChatMember> findByChatIdAndUserId(@Param("chatId") Integer chatId, @Param("userId") Integer userId);

    @Query("SELECT cm FROM ChatMember cm WHERE cm.chat.id IN (" +
            "SELECT cm2.chat.id FROM ChatMember cm2 WHERE cm2.user.id = :userId2 AND cm2.chat.isGroup = false) " +
            "AND cm.user.id = :userId1 AND cm.chat.isGroup = false")
    Optional<ChatMember> findChatBetweenUsers(@Param("userId1") Integer userId1, @Param("userId2") Integer userId2);
    @Query("SELECT cm FROM ChatMember cm WHERE cm.chat.id = :chatId AND cm.isSpam = :isSpam")
    List<ChatMember> findByChatIdAndIsSpam(@Param("chatId") Integer chatId, @Param("isSpam") boolean isSpam);

    List<ChatMember> findByChatIdAndStatusTrue(Integer chatId);

    boolean existsByChatIdAndUserUsernameAndStatusTrue(Integer chatId, String username);

    Optional<Chat> findOneToOneChat(Integer id, Integer id1);
}