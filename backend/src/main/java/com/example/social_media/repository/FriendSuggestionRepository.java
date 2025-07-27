package com.example.social_media.repository;

import com.example.social_media.entity.FriendSuggestion;
import com.example.social_media.entity.FriendSuggestionId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.query.Procedure;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface FriendSuggestionRepository extends JpaRepository<FriendSuggestion, FriendSuggestionId> {
    @Query("SELECT f FROM FriendSuggestion f WHERE f.id.userId = :userId")
    List<FriendSuggestion> findByUserId(@Param("userId") Integer userId);


    void deleteByUserId(Integer userId);

    // Thêm phương thức gọi stored procedure
    @Procedure(name = "sp_UpdateAllFriendSuggestions")
    void updateAllFriendSuggestions(@Param("radius_km") Double radiusKm);


}