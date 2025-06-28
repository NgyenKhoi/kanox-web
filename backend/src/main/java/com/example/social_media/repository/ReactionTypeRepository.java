package com.example.social_media.repository;

import com.example.social_media.entity.ReactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReactionTypeRepository extends JpaRepository<ReactionType, Integer> {

    // Tùy chọn: tìm reaction type theo tên
    ReactionType findByNameIgnoreCase(String name);
}
