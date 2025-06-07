package com.example.social_media.repository;

import com.example.social_media.entity.MediaType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface MediaTypeRepository extends JpaRepository<MediaType, Integer> {
    Optional<MediaType> findByName(String name);
}