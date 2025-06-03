package com.example.social_media.repository;

import com.example.social_media.entity.MessageType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MessageTypeRepository extends JpaRepository<MessageType, Integer> {
    boolean existsByName(String name);
}