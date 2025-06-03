package com.example.social_media.repository;

import com.example.social_media.entity.ChatMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMemberRepository extends JpaRepository<ChatMember, Integer> {
    List<ChatMember> findByUserId(Integer userId); // Thêm phương thức này
}