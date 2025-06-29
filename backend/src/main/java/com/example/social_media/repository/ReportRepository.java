package com.example.social_media.repository;

import com.example.social_media.entity.Report;
import com.example.social_media.entity.TargetType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReportRepository extends JpaRepository<Report, Integer> {
    
    Page<Report> findByStatusTrue(Pageable pageable);
    
    Optional<Report> findByIdAndStatusTrue(Integer id);
    
    Page<Report> findByTargetTypeAndStatusTrue(TargetType targetType, Pageable pageable);
    
    List<Report> findByTargetIdAndTargetTypeAndStatusTrue(Integer targetId, TargetType targetType);
    
    Long countByTargetTypeAndStatusTrue(TargetType targetType);
    
    @Query("SELECT r FROM Report r JOIN r.targetType t WHERE t.code = :typeCode AND r.status = true")
    Page<Report> findByTargetTypeCodeAndStatusTrue(@Param("typeCode") String typeCode, Pageable pageable);
}