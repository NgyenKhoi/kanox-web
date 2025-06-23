package com.example.social_media.repository;

import com.example.social_media.entity.Media;
import com.example.social_media.entity.MediaType;
import com.example.social_media.entity.TargetType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface MediaRepository extends JpaRepository<Media, Integer> {
    List<Media> findByTargetIdAndTargetTypeIdAndMediaTypeIdAndStatus(Integer targetId, Integer targetTypeId, Integer mediaTypeId, Boolean status);
    List<Media> findByTargetIdAndTargetTypeIdAndStatus(Integer targetId, Integer targetTypeId, Boolean status);
    List<Media> findByTargetIdAndTargetTypeAndMediaTypeAndStatusTrue(Integer targetId, TargetType targetType, MediaType mediaType);
    List<Media> findByTargetIdInAndTargetTypeIdAndMediaTypeIdAndStatus(
        List<Integer> targetIds,
        Integer targetTypeId,
        Integer mediaTypeId,
        Boolean status
);
}