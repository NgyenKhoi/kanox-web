package com.example.social_media.repository.post;

import com.example.social_media.entity.PostFlag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PostFlagRepository extends JpaRepository<PostFlag, Integer> {
    Optional<PostFlag> findByPostId(Integer postId);
}
