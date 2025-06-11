package com.example.social_media.repository;

import com.example.social_media.entity.CustomPrivacyList;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CustomPrivacyListRepository extends JpaRepository<CustomPrivacyList, Integer> {
    Optional<CustomPrivacyList> findByIdAndUserIdAndStatus(Integer id, Integer userId, Boolean status);
    Optional<CustomPrivacyList> findByIdAndStatus(Integer id, Boolean status);
}