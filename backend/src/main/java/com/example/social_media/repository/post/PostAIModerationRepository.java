package com.example.social_media.repository.post;

import com.example.social_media.entity.Post;
import com.example.social_media.entity.PostAIModeration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface PostAIModerationRepository extends JpaRepository<PostAIModeration, Integer> {
    Optional<PostAIModeration> findByPost(Post post);

    @Query("""
    SELECT pm.post.id FROM PostAIModeration pm
    WHERE pm.flagged = true
""")
    List<Integer> findFlaggedPostIds();

    Optional<PostAIModeration> findByPostId(Integer id);
}
