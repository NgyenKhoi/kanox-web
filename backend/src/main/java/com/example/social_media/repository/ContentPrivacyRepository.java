package com.example.social_media.repository;

import com.example.social_media.entity.ContentPrivacy;
import com.example.social_media.entity.ContentPrivacyId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContentPrivacyRepository extends JpaRepository<ContentPrivacy, ContentPrivacyId> {
    @Query("SELECT cp FROM ContentPrivacy cp WHERE cp.id.contentId = :contentId AND cp.id.contentTypeId = :contentTypeId")
    Optional<ContentPrivacy> findByContentIdAndContentTypeId(Integer contentId, Integer contentTypeId);

    @Query(value = "CALL sp_CheckContentAccess(:userId, :contentId, :contentTypeId, @hasAccess)", nativeQuery = true)
    void checkContentAccess(Integer userId, Integer contentId, Integer contentTypeId);

    List<ContentPrivacy> findAllByCustomListIdAndStatus(Integer customListId, Boolean status);

    @Modifying
    @Query("UPDATE ContentPrivacy cp SET cp.privacySetting = 'default', cp.customList = null, cp.updatedAt = CURRENT_TIMESTAMP " +
            "WHERE cp.customList.id = :customListId AND cp.status = true")
    int updatePrivacySettingByCustomListId(Integer customListId);
    @Query("SELECT p.owner.id FROM Post p WHERE p.id = :contentId AND p.status = true")

    Optional<Integer> findOwnerIdByContentId(@Param("contentId") Integer contentId);

    Optional<ContentPrivacy> findByContentIdAndContentTypeIdAndStatusTrue(Integer contentId, Integer contentTypeId);

}