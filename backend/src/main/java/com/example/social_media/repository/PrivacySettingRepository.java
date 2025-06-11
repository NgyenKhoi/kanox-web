package com.example.social_media.repository;

import com.example.social_media.entity.PrivacySetting;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PrivacySettingRepository extends JpaRepository<PrivacySetting, Integer> {
    Optional<PrivacySetting> findByTblUserId(Integer userId);
}