package com.example.social_media.repository;
import com.example.social_media.entity.Media;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MediaRepository extends JpaRepository<Media, Integer> {
    List<Media> findByTargetIdAndTargetTypeIdAndMediaTypeIdAndStatus(Integer targetId, Integer targetTypeId, Integer mediaTypeId, Boolean status);
    List<Media> findByTargetIdAndTargetTypeIdAndStatus(Integer targetId, Integer targetTypeId, Boolean status);
}