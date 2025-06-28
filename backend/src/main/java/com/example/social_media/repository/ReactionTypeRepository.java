package com.example.social_media.repository;

import com.example.social_media.entity.ReactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReactionTypeRepository extends JpaRepository<ReactionType, Integer> {

    Optional<ReactionType> findByNameIgnoreCase(String name);
}
