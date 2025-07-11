package com.example.social_media.repository;
import com.example.social_media.entity.PrivacySetting;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PrivacySettingRepository extends JpaRepository<PrivacySetting, Integer> {
    @Query("SELECT ps FROM PrivacySetting ps WHERE ps.tblUser.id IN :userIds")
    List<PrivacySetting> findByUserIdIn(@Param("userIds") List<Integer> userIds);
}