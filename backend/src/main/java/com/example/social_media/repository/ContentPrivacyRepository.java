package com.example.social_media.repository;

import com.example.social_media.entity.ContentPrivacy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ContentPrivacyRepository extends JpaRepository<ContentPrivacy, Integer> {
    @Query("SELECT cp FROM ContentPrivacy cp WHERE cp.id.contentId = :contentId AND cp.id.contentTypeId = :contentTypeId")
    Optional<ContentPrivacy> findByContentIdAndContentTypeId(Integer contentId, Integer contentTypeId);

    @Query(value = "CALL sp_CheckContentAccess(:userId, :contentId, :contentTypeId, @hasAccess)", nativeQuery = true)
    void checkContentAccess(Integer userId, Integer contentId, Integer contentTypeId);
}