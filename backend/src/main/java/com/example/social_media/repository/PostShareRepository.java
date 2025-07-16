package com.example.social_media.repository;

import com.example.social_media.entity.Post;
import com.example.social_media.entity.PostShare;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface PostShareRepository extends JpaRepository<PostShare, Integer> {

    // Đếm số lượt một bài viết được chia sẻ
    long countByOriginalPostAndStatusTrue(Post originalPost);

    // Tìm bài viết gốc dựa trên bài viết chia sẻ
    Optional<PostShare> findBySharedPostAndStatusTrue(Post sharedPost);

    // (Tối ưu) Lấy số lượt chia sẻ cho nhiều bài viết cùng lúc để tránh N+1 query
    @Query("SELECT ps.originalPost.id, COUNT(ps.id) FROM PostShare ps WHERE ps.originalPost.id IN :postIds AND ps.status = true GROUP BY ps.originalPost.id")
    List<Object[]> findShareCountsForPosts(@Param("postIds") List<Integer> postIds);

    // (Tối ưu) Lấy các bài viết gốc cho nhiều bài viết chia sẻ cùng lúc
    @Query("SELECT ps FROM PostShare ps JOIN FETCH ps.originalPost WHERE ps.sharedPost.id IN :postIds AND ps.status = true")
    List<PostShare> findOriginalsForSharedPosts(@Param("postIds") List<Integer> postIds);
}
