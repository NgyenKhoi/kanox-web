package com.example.social_media.repository;

import com.example.social_media.entity.TargetType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface TargetTypeRepository extends JpaRepository<TargetType, Integer> {
    Optional<TargetType> findByCode(String code);
    Optional<TargetType> findById(Integer id);
}