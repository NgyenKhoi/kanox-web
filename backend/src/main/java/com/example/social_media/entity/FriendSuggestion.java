package com.example.social_media.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;

@Entity
@NamedStoredProcedureQuery(
        name = "sp_UpdateAllFriendSuggestions",
        procedureName = "sp_UpdateAllFriendSuggestions",
        parameters = {
                @StoredProcedureParameter(mode = ParameterMode.IN, name = "radius_km", type = Double.class)
        }
)
@Table(name = "tblFriendSuggestion", schema = "dbo")
public class FriendSuggestion {
    @EmbeddedId
    private FriendSuggestionId id;

    @MapsId("userId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @MapsId("suggestedUserId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "suggested_user_id", nullable = false)
    private User suggestedUser;

    @NotNull
    @Column(name = "mutual_friend_count", nullable = false)
    private Integer mutualFriendCount;

    @Column(name = "mutual_friend_ids")
    private String mutualFriendIds;

    @ColumnDefault("getdate()")
    @Column(name = "suggested_at")
    private Instant suggestedAt;

    @Column(name = "expiration_date")
    private Instant expirationDate;

    @Column(name = "reason")
    private String reason;

    @Column(name = "distance_km")
    private Double distanceKm;

    public FriendSuggestionId getId() {
        return id;
    }

    public void setId(FriendSuggestionId id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public User getSuggestedUser() {
        return suggestedUser;
    }

    public void setSuggestedUser(User suggestedUser) {
        this.suggestedUser = suggestedUser;
    }

    public Integer getMutualFriendCount() {
        return mutualFriendCount;
    }

    public void setMutualFriendCount(Integer mutualFriendCount) {
        this.mutualFriendCount = mutualFriendCount;
    }

    public String getMutualFriendIds() {
        return mutualFriendIds;
    }

    public void setMutualFriendIds(String mutualFriendIds) {
        this.mutualFriendIds = mutualFriendIds;
    }

    public Instant getSuggestedAt() {
        return suggestedAt;
    }

    public void setSuggestedAt(Instant suggestedAt) {
        this.suggestedAt = suggestedAt;
    }

    public Instant getExpirationDate() {
        return expirationDate;
    }

    public void setExpirationDate(Instant expirationDate) {
        this.expirationDate = expirationDate;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public Double getDistanceKm() {
        return distanceKm;
    }

    public void setDistanceKm(Double distanceKm) {
        this.distanceKm = distanceKm;
    }
}