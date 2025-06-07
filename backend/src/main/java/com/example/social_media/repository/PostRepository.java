package com.example.social_media.repository;

import com.example.social_media.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.query.Procedure;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Integer> {

    @Procedure(name = "sp_CreatePost")
    Integer createPost(
            @Param("owner_id") Integer ownerId,
            @Param("content") String content,
            @Param("privacy_setting") String privacySetting,
            @Param("media_urls") String mediaUrls,
            @Param("tagged_user_ids") String taggedUserIds,
            @Param("custom_list_id") Integer customListId
    );

    @Query(value = """
        SELECT p.*
        FROM tblPost p
        INNER JOIN tblFriendship f ON p.owner_id = f.friend_id
        WHERE f.user_id = :userId AND f.friendship_status = 'accepted' AND f.status = 1
            AND p.status = 1
            AND (p.privacy_setting = 'public' 
                 OR (p.privacy_setting = 'friends' AND f.friend_id = p.owner_id)
                 OR (p.privacy_setting = 'custom' 
                     AND EXISTS (
                         SELECT 1 
                         FROM tblContentPrivacy cp 
                         INNER JOIN tblCustomPrivacyListMembers cplm 
                         ON cp.custom_list_id = cplm.list_id 
                         WHERE cp.content_id = p.id 
                         AND cp.content_type_id = 1 
                         AND cplm.member_user_id = :userId 
                         AND cplm.status = 1
                     ))
                 OR (p.privacy_setting = 'only_me' AND p.owner_id = :userId))
        UNION
        SELECT p.*
        FROM tblPost p
        WHERE p.owner_id = :userId AND p.status = 1
        ORDER BY p.created_at DESC
    """, nativeQuery = true)
    List<Post> findNewsfeedPosts(@Param("userId") Integer userId);
}