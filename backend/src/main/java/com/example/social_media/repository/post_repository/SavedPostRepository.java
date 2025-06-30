package com.example.social_media.repository.post_repository;

import com.example.social_media.entity.SavedPost;
import com.example.social_media.entity.SavedPostId;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface SavedPostRepository extends JpaRepository<SavedPost, SavedPostId> {
    Optional<SavedPost> findByUserIdAndPostId(Integer userId, Integer postId);
    @Query("SELECT sp FROM SavedPost sp " +
            "WHERE sp.user.id = :userId " +
            "AND sp.status = true " +
            "AND sp.post.status = true " +
            "AND (:from IS NULL OR sp.saveTime >= :from) " +
            "AND (:to IS NULL OR sp.saveTime <= :to) " +
            "ORDER BY sp.saveTime DESC")
    List<SavedPost> findActiveSavedPostsByUserIdAndSaveTimeBetween(
            @Param("userId") Integer userId,
            @Param("from") Instant from,
            @Param("to") Instant to);
}