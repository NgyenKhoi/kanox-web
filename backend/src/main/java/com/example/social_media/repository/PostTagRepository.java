package com.example.social_media.repository;

import com.example.social_media.entity.PostTag;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostTagRepository extends JpaRepository<PostTag, Integer> {
}