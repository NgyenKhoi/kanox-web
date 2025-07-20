package com.example.social_media.repository.post_repository;

import com.example.social_media.entity.Post;
import com.example.social_media.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.query.Procedure;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Integer> {
    // Các phương thức hiện có giữ nguyên
    @Procedure(name = "sp_CreatePost")
    Integer createPost(
            @Param("owner_id") Integer ownerId,
            @Param("content") String content,
            @Param("privacy_setting") String privacySetting,
            @Param("media_urls") String mediaUrls,
            @Param("tagged_user_ids") String taggedUserIds,
            @Param("custom_list_id") Integer customListId,
            @Param("group_id") Integer groupId,
            @Param("latitude") Double latitude,
            @Param("longitude") Double longitude,
            @Param("location_name") String locationName
    );

    @Query(value = """
    SELECT p.*
    FROM tblPost p
    LEFT JOIN tblGroup g ON p.group_id = g.id
    WHERE p.status = 1
      AND (
        -- Bài viết của chính user
        p.owner_id = :userId

        -- Bài viết của bạn bè: chỉ khi privacy là 'friends' hoặc 'public'
        OR (
            p.owner_id IN (
                SELECT friend_id FROM tblFriendship
                WHERE user_id = :userId AND friendship_status = 'accepted' AND status = 1
                UNION
                SELECT user_id FROM tblFriendship
                WHERE friend_id = :userId AND friendship_status = 'accepted' AND status = 1
            )
            AND p.privacy_setting IN ('friends', 'public')
        )

        -- Bài viết public của người lạ
        OR p.privacy_setting = 'public'

        -- Bài trong nhóm user đã tham gia
        OR (
            p.group_id IN (
                SELECT group_id FROM tblGroupMember
                WHERE user_id = :userId AND invite_status = 'ACCEPTED' AND status = 1
            )
        )
    )
    ORDER BY p.created_at DESC
    """, nativeQuery = true)
    List<Post> findNewsfeedPosts(@Param("userId") Integer userId);

    @EntityGraph(attributePaths = {"tblComments"})
    @Query("SELECT p FROM Post p WHERE p.owner.username = :username AND p.status = true ORDER BY p.createdAt DESC")
    List<Post> findActivePostsByUsername(String username);

    int countByOwnerAndStatusTrue(User owner);

    @EntityGraph(attributePaths = {"tblComments"})
    List<Post> findByGroupIdAndStatusTrueOrderByCreatedAtDesc(Integer groupId);

    long count();
    @EntityGraph(attributePaths = {"tblComments"})
    List<Post> findByOwnerIdAndGroupIdAndStatusTrueOrderByCreatedAtDesc(Integer ownerId, Integer groupId);

    @Query(value = """
    SELECT p.*
    FROM tblPost p
    JOIN tblGroup g ON p.group_id = g.id
    WHERE p.status = 1
      AND g.status = 1
      AND (
          -- Bài viết từ các nhóm công khai
          g.privacy_level = 'public'

          -- Hoặc nhóm mà user đã tham gia
          OR g.id IN (
              SELECT group_id FROM tblGroupMember
              WHERE user_id = :userId AND invite_status = 'ACCEPTED' AND status = 1
          )
      )
    ORDER BY p.created_at DESC
""", nativeQuery = true)
    List<Post> findCommunityFeedPosts(@Param("userId") Integer userId);
}