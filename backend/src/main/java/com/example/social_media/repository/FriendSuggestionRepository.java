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
    @Query("SELECT fs FROM FriendSuggestion fs WHERE fs.user.id = :userId")
    List<FriendSuggestion> findByUserId(Integer userId);

    @Procedure(procedureName = "sp_UpdateAllFriendSuggestions")
    void updateAllFriendSuggestions(Double radiusKm);

    @Procedure(procedureName = "sp_UpdateFriendSuggestionsForUser")
    void updateFriendSuggestionsForUser(Integer userId, Double radiusKm);
}