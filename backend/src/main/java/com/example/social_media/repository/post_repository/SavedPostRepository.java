package com.example.social_media.repository.post_repository;

import com.example.social_media.entity.SavedPost;
import com.example.social_media.entity.SavedPostId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SavedPostRepository extends JpaRepository<SavedPost, SavedPostId> {
    Optional<SavedPost> findByUserIdAndPostId(Integer userId, Integer postId);
}