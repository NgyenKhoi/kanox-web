package com.example.social_media.repository.post;

import com.example.social_media.entity.PostTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostTagRepository extends JpaRepository<PostTag, Integer> {
    List<PostTag> findByPostIdAndStatusTrue(Integer postId);
    void deleteByPostId(Integer postId);

    List<PostTag> findByPost_IdInAndStatusTrue(List<Integer> postIds);

    List<PostTag> findAllByPostIdInAndStatusTrue(List<Integer> postIds);
}