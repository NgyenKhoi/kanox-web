package com.example.social_media.repository;

import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import com.example.social_media.entity.Comment;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Integer> {

    List<Comment> findByPostIdAndStatusTrue(Integer postId);

    int countByPostIdAndStatusTrue(Integer postId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Comment c WHERE c.post.id = :postId")
    void deleteAllByPostId(@Param("postId") Integer postId);

    @Query("SELECT c.id FROM Comment c WHERE c.post.id = :postId")
    List<Integer> findIdsByPostId(@Param("postId") Integer postId);
}
