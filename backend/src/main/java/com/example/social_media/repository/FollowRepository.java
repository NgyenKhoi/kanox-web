package com.example.social_media.repository;

import com.example.social_media.entity.Follow;
import com.example.social_media.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FollowRepository extends JpaRepository<Follow, Long> {
    int countByFolloweeAndStatusTrue(User followee);
    int countByFollowerAndStatusTrue(User follower);
    //not use now
    List<Follow> findByIdFolloweeIdAndStatusTrue(Integer followeeId);
    List<Follow> findByIdFollowerIdAndStatusTrue(Integer followerId);
}
