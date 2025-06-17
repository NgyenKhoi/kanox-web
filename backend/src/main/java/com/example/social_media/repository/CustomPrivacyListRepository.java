package com.example.social_media.repository;

import com.example.social_media.entity.CustomPrivacyList;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomPrivacyListRepository extends JpaRepository<CustomPrivacyList, Integer> {
    Optional<CustomPrivacyList> findByIdAndUserIdAndStatus(Integer id, Integer userId, Boolean status);
    Optional<CustomPrivacyList> findByIdAndStatus(Integer id, Boolean status);
    List<CustomPrivacyList> findAllByUserIdAndStatus(Integer userId, Boolean status);
    boolean existsByUserIdAndListNameAndStatus(Integer userId, String listName, Boolean status);
    Optional<CustomPrivacyList> findByIdAndStatusTrue(Integer id);
}