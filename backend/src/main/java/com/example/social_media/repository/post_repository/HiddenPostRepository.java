package com.example.social_media.repository.post_repository;

import com.example.social_media.entity.HiddenPost;
import com.example.social_media.entity.HiddenPostId;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface HiddenPostRepository extends JpaRepository<HiddenPost, HiddenPostId> {
    Optional<HiddenPost> findByUserIdAndPostId(Integer userId, Integer postId);
    @Query("SELECT hp.id.postId FROM HiddenPost hp WHERE hp.id.userId = :userId AND hp.status = true")
    List<Integer> findHiddenPostIdsByUserId(@Param("userId") Integer userId);
}
