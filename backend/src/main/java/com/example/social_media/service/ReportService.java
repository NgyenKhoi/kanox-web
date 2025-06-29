package com.example.social_media.service;

import com.example.social_media.entity.Report;
import com.example.social_media.entity.TargetType;
import com.example.social_media.entity.Post;
import com.example.social_media.entity.Comment;
import com.example.social_media.repository.ReportRepository;
import com.example.social_media.repository.TargetTypeRepository;
import com.example.social_media.repository.PostRepository;
import com.example.social_media.repository.CommentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
public class ReportService {
    private static final Logger logger = LoggerFactory.getLogger(ReportService.class);

    private final ReportRepository reportRepository;
    private final TargetTypeRepository targetTypeRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final ActivityLogService activityLogService;

    @Autowired
    public ReportService(ReportRepository reportRepository, 
                         TargetTypeRepository targetTypeRepository,
                         PostRepository postRepository,
                         CommentRepository commentRepository,
                         ActivityLogService activityLogService) {
        this.reportRepository = reportRepository;
        this.targetTypeRepository = targetTypeRepository;
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.activityLogService = activityLogService;
    }

    /**
     * Lấy tất cả báo cáo với phân trang
     */
    public Page<Report> getAllReports(Pageable pageable) {
        logger.info("Getting all reports with pagination: {}", pageable);
        return reportRepository.findByStatusTrue(pageable);
    }

    /**
     * Lấy báo cáo theo loại nội dung với phân trang
     */
    public Page<Report> getReportsByType(String typeCode, Pageable pageable) {
        logger.info("Getting reports by type: {}", typeCode);
        return reportRepository.findByTargetTypeCodeAndStatusTrue(typeCode, pageable);
    }

    /**
     * Lấy chi tiết báo cáo theo ID
     */
    public Report getReportById(Integer id) {
        logger.info("Getting report details with ID: {}", id);
        return reportRepository.findByIdAndStatusTrue(id)
                .orElseThrow(() -> new IllegalArgumentException("Report not found with ID: " + id));
    }

    /**
     * Xử lý báo cáo (đánh dấu đã xử lý)
     */
    @Transactional
    public Report resolveReport(Integer id, String adminUsername) {
        logger.info("Resolving report with ID: {}", id);
        Report report = getReportById(id);
        report.setStatus(false); // Đánh dấu đã xử lý
        Report savedReport = reportRepository.save(report);
        
        // Ghi log hoạt động
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("reportId", id);
        metadata.put("targetId", report.getTargetId());
        metadata.put("targetType", report.getTargetType().getCode());
        
        activityLogService.logActivity(
            adminUsername,
            "RESOLVE_REPORT",
            "Resolved report #" + id,
            report.getTargetId().toString(),
            report.getTargetType().getCode(),
            metadata
        );
        
        return savedReport;
    }

    /**
     * Gỡ nội dung bị báo cáo (bài viết)
     */
    @Transactional
    public void removeReportedPost(Integer postId, String adminUsername) {
        logger.info("Removing reported post with ID: {}", postId);
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found with ID: " + postId));
        
        // Xóa mềm bài viết
        post.setStatus(false);
        postRepository.save(post);
        
        // Ghi log hoạt động
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("postId", postId);
        metadata.put("ownerId", post.getOwner().getId());
        
        activityLogService.logActivity(
            adminUsername,
            "REMOVE_REPORTED_POST",
            "Removed violating post #" + postId,
            postId.toString(),
            "POST",
            metadata
        );
    }

    /**
     * Gỡ nội dung bị báo cáo (bình luận)
     */
    @Transactional
    public void removeReportedComment(Integer commentId, String adminUsername) {
        logger.info("Removing reported comment with ID: {}", commentId);
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found with ID: " + commentId));
        
        // Xóa mềm bình luận
        comment.setStatus(false);
        commentRepository.save(comment);
        
        // Ghi log hoạt động
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("commentId", commentId);
        metadata.put("postId", comment.getPost().getId());
        metadata.put("userId", comment.getUser().getId());
        
        activityLogService.logActivity(
            adminUsername,
            "REMOVE_REPORTED_COMMENT",
            "Removed violating comment #" + commentId,
            commentId.toString(),
            "COMMENT",
            metadata
        );
    }
    
    /**
     * Gỡ nội dung bị báo cáo dựa trên loại
     */
    @Transactional
    public void removeReportedContent(Integer targetId, String targetTypeCode, String adminUsername) {
        logger.info("Removing reported content: {} - {}", targetTypeCode, targetId);
        
        switch (targetTypeCode.toUpperCase()) {
            case "POST":
                removeReportedPost(targetId, adminUsername);
                break;
            case "COMMENT":
                removeReportedComment(targetId, adminUsername);
                break;
            default:
                throw new IllegalArgumentException("Unsupported content type: " + targetTypeCode);
        }
    }
}