package com.example.social_media.repository.post;

import com.example.social_media.entity.SavedPost;
import com.example.social_media.entity.SavedPostId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.query.Procedure;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface SavedPostRepository extends JpaRepository<SavedPost, SavedPostId> {

    Optional<SavedPost> findByUserIdAndPostId(Integer userId, Integer postId);
    @Query("SELECT sp FROM SavedPost sp WHERE sp.user.id = :userId AND sp.status = true")
    List<SavedPost> findByUserIdAndStatusTrue(@Param("userId") Integer userId);


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

    // Gọi stored procedure sp_SavePost
    @Procedure(procedureName = "sp_SavePost")
    void callSavePost(@Param("user_id") Integer userId, @Param("post_id") Integer postId);
}
