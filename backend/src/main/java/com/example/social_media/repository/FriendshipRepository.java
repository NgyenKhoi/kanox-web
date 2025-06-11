package com.example.social_media.repository;

import com.example.social_media.entity.Friendship;
import com.example.social_media.entity.FriendshipId;
import com.example.social_media.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface FriendshipRepository extends JpaRepository<Friendship, FriendshipId> {
    Optional<Friendship> findByUserAndFriendAndStatus(User user, User friend, Boolean status);
    List<Friendship> findByUserAndFriendshipStatusAndStatus(User user, String friendshipStatus, Boolean status);
    List<Friendship> findByFriendAndFriendshipStatusAndStatus(User friend, String friendshipStatus, Boolean status);
    boolean existsByUserAndFriendAndStatus(User user, User friend, Boolean status);

    @Query("SELECT f FROM Friendship f WHERE (f.user = :user OR f.friend = :user) " +
            "AND f.friendshipStatus = 'accepted' AND f.status = true")
    Page<Friendship> findFriendsByUser(User user, Pageable pageable);

    Page<Friendship> findByUserAndFriendshipStatusAndStatus(User user, String friendshipStatus, Boolean status, Pageable pageable);
    Page<Friendship> findByFriendAndFriendshipStatusAndStatus(User friend, String friendshipStatus, Boolean status, Pageable pageable);
}