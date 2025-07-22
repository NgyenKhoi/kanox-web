package com.example.social_media.repository;

import com.example.social_media.entity.Media;
import com.example.social_media.entity.MediaType;
import com.example.social_media.entity.TargetType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MediaRepository extends JpaRepository<Media, Integer> {
    List<Media> findByTargetIdAndTargetTypeIdAndMediaTypeIdAndStatus(Integer targetId, Integer targetTypeId, Integer mediaTypeId, Boolean status);
    List<Media> findByTargetIdAndTargetTypeAndMediaTypeAndStatusTrue(Integer targetId, TargetType targetType, MediaType mediaType);
    List<Media> findByTargetIdInAndTargetTypeIdAndMediaTypeIdAndStatus(
        List<Integer> targetIds,
        Integer targetTypeId,
        Integer mediaTypeId,
        Boolean status
);
    Optional<Media> findFirstByTargetIdAndTargetType_CodeAndMediaType_NameOrderByCreatedAtDesc(Integer userId, String profile, String image);
    List<Media> findByTargetIdAndTargetTypeCodeAndCaptionAndStatusTrue(Integer groupId, String group, String avatar);
    List<Media> findByTargetIdInAndTargetTypeIdAndStatus(List<Integer> targetIds, Integer targetTypeId, Boolean status);
    List<Media> findByTargetIdAndTargetType_CodeAndMediaType_NameAndStatus(
            Integer targetId, String targetTypeCode, String mediaTypeName, Boolean status);
}