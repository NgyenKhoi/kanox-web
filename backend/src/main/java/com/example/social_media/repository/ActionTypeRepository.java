package com.example.social_media.repository;

import com.example.social_media.entity.ActionType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ActionTypeRepository extends JpaRepository<ActionType, Integer> {
    Optional<ActionType> findByName(String name);
}