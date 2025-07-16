package com.example.social_media.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.social_media.entity.Comment;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Integer> {

    List<Comment> findByPostIdAndStatusTrue(Integer postId);

    int countByPostIdAndStatusTrue(Integer postId);

}
