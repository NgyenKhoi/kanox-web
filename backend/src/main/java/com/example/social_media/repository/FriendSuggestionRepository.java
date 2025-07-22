package com.example.social_media.repository;

import com.example.social_media.entity.FriendSuggestion;
import com.example.social_media.entity.FriendSuggestionId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface FriendSuggestionRepository extends JpaRepository<FriendSuggestion, FriendSuggestionId> {
    List<FriendSuggestion> findByUserIdAndExpirationDateAfter(Integer userId, Instant expirationDate);

    void deleteByUserId(Integer userId);

    // Thêm phương thức gọi stored procedure
    @Query(value = "CALL sp_UpdateAllFriendSuggestions(:radiusKm)", nativeQuery = true)
    void updateAllFriendSuggestions(@Param("radiusKm") Double radiusKm);
}