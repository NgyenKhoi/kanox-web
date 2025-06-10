package com.example.social_media.repository;

import com.example.social_media.entity.PostTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostTagRepository extends JpaRepository<PostTag, Integer> {
    List<PostTag> findByPostIdAndStatusTrue(Integer postId);
    void deleteByPostId(Integer postId);
}