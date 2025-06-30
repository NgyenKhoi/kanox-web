package com.example.social_media.repository.post_repository;

import com.example.social_media.entity.HiddenPost;
import com.example.social_media.entity.HiddenPostId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface HiddenPostRepository extends JpaRepository<HiddenPost, HiddenPostId> {
    Optional<HiddenPost> findByUserIdAndPostId(Integer userId, Integer postId);
}
