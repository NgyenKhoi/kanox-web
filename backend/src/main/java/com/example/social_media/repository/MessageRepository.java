package com.example.social_media.repository;

import com.example.social_media.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<Message, Integer> {
    List<Message> findByChatId(Integer chatId); // Thay Long bằng Integer
    Optional<Message> findTopByChatIdOrderByCreatedAtDesc(Integer chatId); // Thêm phương thức này
}