package com.example.social_media.repository;

import com.example.social_media.entity.ContentPolicy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContentPolicyRepository extends JpaRepository<ContentPolicy, Integer> {
    
    // Tìm tất cả chính sách đang hoạt động
    @Query("SELECT cp FROM ContentPolicy cp WHERE cp.status = true ORDER BY cp.id DESC")
    List<ContentPolicy> findAllActivePolicies();
    
    // Tìm chính sách theo tên với phân trang
    @Query("SELECT cp FROM ContentPolicy cp WHERE cp.status = true AND cp.policyName LIKE %:policyName% ORDER BY cp.id DESC")
    Page<ContentPolicy> findByPolicyNameContaining(@Param("policyName") String policyName, Pageable pageable);
    
    // Tìm tất cả chính sách với phân trang
    @Query("SELECT cp FROM ContentPolicy cp ORDER BY cp.id DESC")
    Page<ContentPolicy> findAllWithPagination(Pageable pageable);
    
    // Kiểm tra chính sách đã tồn tại chưa
    @Query("SELECT COUNT(cp) > 0 FROM ContentPolicy cp WHERE cp.policyName = :policyName AND cp.status = true")
    boolean existsByPolicyName(@Param("policyName") String policyName);
    
    // Tìm chính sách theo trạng thái
    @Query("SELECT cp FROM ContentPolicy cp WHERE cp.status = :status ORDER BY cp.id DESC")
    Page<ContentPolicy> findByStatus(@Param("status") Boolean status, Pageable pageable);
    
    // Tìm chính sách theo mô tả
    @Query("SELECT cp FROM ContentPolicy cp WHERE cp.status = true AND cp.description LIKE %:description% ORDER BY cp.id DESC")
    Page<ContentPolicy> findByDescriptionContaining(@Param("description") String description, Pageable pageable);
}