package com.example.social_media.repository.post;

import com.example.social_media.entity.HiddenPost;
import com.example.social_media.entity.HiddenPostId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.query.Procedure;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface HiddenPostRepository extends JpaRepository<HiddenPost, HiddenPostId> {

    Optional<HiddenPost> findByUserIdAndPostId(Integer userId, Integer postId);

    @Query("SELECT hp.id.postId FROM HiddenPost hp WHERE hp.id.userId = :userId AND hp.status = true")
    List<Integer> findHiddenPostIdsByUserId(@Param("userId") Integer userId);

    @Procedure(procedureName = "sp_HidePost")
    void callHidePost(@Param("user_id") Integer userId, @Param("post_id") Integer postId);
}
