package com.example.social_media.repository;

import com.example.social_media.entity.Reaction;
import com.example.social_media.entity.ReactionId;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReactionRepository extends JpaRepository<Reaction, ReactionId> {

    Optional<Reaction> findById(ReactionId id);

    List<Reaction> findById_TargetIdAndId_TargetTypeIdAndStatusTrue(Integer targetId, Integer targetTypeId);

    void deleteByIdUserIdAndIdTargetIdAndIdTargetTypeId(Integer userId, Integer targetId, Integer targetTypeId);

    Optional<Reaction> findByIdUserIdAndIdTargetIdAndIdTargetTypeId(Integer userId, Integer targetId, Integer targetTypeId);

    List<Reaction> findByIdTargetIdAndIdTargetTypeIdAndReactionTypeIdAndStatusTrue(Integer targetId, Integer id, Integer id1);

    @Query("""
    SELECT r.id.targetId, r.reactionType.name, COUNT(r)
    FROM Reaction r
    WHERE r.id.targetId IN :targetIds
      AND r.targetType.code = :targetTypeCode
      AND r.status = true
    GROUP BY r.id.targetId, r.reactionType.name
""")
    List<Object[]> countAllByTargetIdsAndType(
            @Param("targetIds") List<Integer> targetIds,
            @Param("targetTypeCode") String targetTypeCode);


}
