package com.example.social_media.repository;

import com.example.social_media.entity.Follow;
import com.example.social_media.entity.FollowId;
import com.example.social_media.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

import java.util.List;

public interface FollowRepository extends JpaRepository<Follow, Long> {
    int countByFolloweeAndStatusTrue(User followee);
    int countByFollowerAndStatusTrue(User follower);
    //not use now
    List<Follow> findByIdFolloweeIdAndStatusTrue(Integer followeeId);
    List<Follow> findByIdFollowerIdAndStatusTrue(Integer followerId);

    Optional<Follow> findByFollowerAndFolloweeAndStatus(User follower, User followee, Boolean status);
    Page<Follow> findByFollowerAndStatus(User follower, Boolean status, Pageable pageable);
    Page<Follow> findByFolloweeAndStatus(User followee, Boolean status, Pageable pageable);
    boolean existsByFollowerAndFolloweeAndStatus(User follower, User followee, Boolean status);
}
