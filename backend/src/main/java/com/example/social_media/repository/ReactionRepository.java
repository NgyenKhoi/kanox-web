package com.example.social_media.repository;

import com.example.social_media.entity.Reaction;
import com.example.social_media.entity.ReactionId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReactionRepository extends JpaRepository<Reaction, ReactionId> {

    Optional<Reaction> findById(ReactionId id);

    List<Reaction> findByIdTargetIdAndIdTargetTypeIdAndStatusTrue(Integer targetId, Integer targetTypeId);

    void deleteByIdUserIdAndIdTargetIdAndIdTargetTypeId(Integer userId, Integer targetId, Integer targetTypeId);

    Optional<Reaction> findByIdUserIdAndIdTargetIdAndIdTargetTypeId(Integer userId, Integer targetId, Integer targetTypeId);

    List<Reaction> findByIdTargetIdAndIdTargetTypeIdAndReactionTypeIdAndStatusTrue(Integer targetId, Integer id, Integer id1);
}
