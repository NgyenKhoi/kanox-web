package com.example.social_media.repository;

import com.example.social_media.entity.BannedKeyword;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BannedKeywordRepository extends JpaRepository<BannedKeyword, Integer> {
    
    // Tìm tất cả từ khóa bị cấm đang hoạt động
    @Query("SELECT bk FROM BannedKeyword bk WHERE bk.status = true ORDER BY bk.createdAt DESC")
    List<BannedKeyword> findAllActiveKeywords();
    
    // Tìm từ khóa theo keyword với phân trang
    @Query("SELECT bk FROM BannedKeyword bk WHERE bk.status = true AND bk.keyword LIKE %:keyword% ORDER BY bk.createdAt DESC")
    Page<BannedKeyword> findByKeywordContaining(@Param("keyword") String keyword, Pageable pageable);
    
    // Tìm tất cả từ khóa với phân trang
    @Query("SELECT bk FROM BannedKeyword bk ORDER BY bk.createdAt DESC")
    Page<BannedKeyword> findAllWithPagination(Pageable pageable);
    
    // Kiểm tra từ khóa đã tồn tại chưa
    @Query("SELECT COUNT(bk) > 0 FROM BannedKeyword bk WHERE bk.keyword = :keyword AND bk.status = true")
    boolean existsByKeyword(@Param("keyword") String keyword);
    
    // Tìm từ khóa theo trạng thái
    @Query("SELECT bk FROM BannedKeyword bk WHERE bk.status = :status ORDER BY bk.createdAt DESC")
    Page<BannedKeyword> findByStatus(@Param("status") Boolean status, Pageable pageable);
}