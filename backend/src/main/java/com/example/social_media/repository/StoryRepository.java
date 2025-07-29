package com.example.social_media.repository;

import java.util.List;

import com.example.social_media.entity.Story;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.query.Procedure;
import org.springframework.data.repository.query.Param;

public interface StoryRepository extends JpaRepository<Story, Integer> {

    /**
     * Khai báo để gọi Stored Procedure sp_CreateStory. Tên của phương thức
     * (createStory) không quan trọng, nhưng annotation @Procedure phải đúng.
     *
     * @return ID của story mới được tạo.
     */
    @Procedure(name = "sp_CreateStory")
    Integer createStory(
            @Param("user_id") Integer userId,
            @Param("caption") String caption,
            @Param("media_url") String mediaUrl,
            @Param("media_type") String mediaType,
            @Param("privacy_setting") String privacySetting,
            @Param("background_color") String backgroundColor,
            @Param("custom_list_id") Integer customListId
    );

    @Query("SELECT s FROM Story s WHERE s.user.id = :userId AND s.status = true AND s.expireTime > CURRENT_TIMESTAMP ORDER BY s.createdAt DESC")
    List<Story> findActiveStoriesByUserId(@Param("userId") Integer userId);
}
