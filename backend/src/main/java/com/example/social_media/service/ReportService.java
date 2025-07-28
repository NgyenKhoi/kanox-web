package com.example.social_media.service;

import com.example.social_media.dto.report.CreateReportRequestDto;
import com.example.social_media.dto.report.ReportResponseDto;
import com.example.social_media.dto.report.UpdateReportStatusRequestDto;
import com.example.social_media.dto.report.ReportReasonDto;
import com.example.social_media.entity.*;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.repository.*;
import com.example.social_media.repository.post.PostAIModerationRepository;
import com.example.social_media.repository.post.PostFlagRepository;
import com.example.social_media.repository.post.PostRepository;
import com.example.social_media.repository.report.*;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.SQLException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final ReportReasonRepository reportReasonRepository;
    private final ReportStatusRepository reportStatusRepository;
    private final ReportHistoryRepository reportHistoryRepository;
    private final ReportLimitRepository reportLimitRepository;
    private final PostRepository postRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;
    private final PostFlagRepository postFlagRepository;
    private final PostAIModerationRepository postAIModerationRepository;
    private final MediaRepository mediaRepository;
    private final CommentRepository  commentRepository;
    private final ReactionRepository reactionRepository;

    private static final int MAX_REPORTS_PER_DAY = 3;

    public ReportService(
            ReportRepository reportRepository,
            UserRepository userRepository,
            ReportReasonRepository reportReasonRepository,
            ReportStatusRepository reportStatusRepository,
            ReportHistoryRepository reportHistoryRepository,
            ReportLimitRepository reportLimitRepository,
            PostRepository postRepository,
            SimpMessagingTemplate messagingTemplate,
            NotificationService notificationService,
            PostFlagRepository postFlagRepository,
            PostAIModerationRepository postAIModerationRepository,
            MediaRepository mediaRepository,
            CommentRepository commentRepository,
            ReactionRepository reactionRepository
    ) {
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
        this.reportReasonRepository = reportReasonRepository;
        this.reportStatusRepository = reportStatusRepository;
        this.reportHistoryRepository = reportHistoryRepository;
        this.reportLimitRepository = reportLimitRepository;
        this.postRepository = postRepository;
        this.messagingTemplate = messagingTemplate;
        this.notificationService = notificationService;
        this.postFlagRepository = postFlagRepository;
        this.postAIModerationRepository = postAIModerationRepository;
        this.mediaRepository = mediaRepository;
        this.commentRepository = commentRepository;
        this.reactionRepository = reactionRepository;
    }

    @Transactional
    public void createReport(CreateReportRequestDto request) {
        User reporter = userRepository.findById(request.getReporterId())
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + request.getReporterId()));

        ReportReason reason = reportReasonRepository.findById(request.getReasonId())
                .orElseThrow(() -> new IllegalArgumentException("Report reason not found with id: " + request.getReasonId()));

        try {
            ReportStatus status = reportStatusRepository.findById(1)
                    .orElseThrow(() -> new IllegalArgumentException("Report status not found with id: 1"));

            Integer reportId = reportRepository.addReport(
                    request.getReporterId(),
                    request.getTargetId(),
                    request.getTargetTypeId(),
                    request.getReasonId(),
                    1,
                    true
            );

            Report report = reportRepository.findById(reportId)
                    .orElseThrow(() -> new IllegalArgumentException("Report not found with id: " + reportId));

            messagingTemplate.convertAndSend("/topic/admin/reports", Map.of(
                    "id", reportId,
                    "targetId", request.getTargetId(),
                    "targetTypeId", request.getTargetTypeId(),
                    "reporterUsername", reporter.getUsername(),
                    "reason", reason.getName(),
                    "createdAt", System.currentTimeMillis() / 1000,
                    "processingStatusId", status.getId(),
                    "processingStatusName", status.getName()
            ));

            ReportHistory history = new ReportHistory();
            history.setReporter(reporter);
            history.setReport(report);
            history.setProcessingStatus(status);
            history.setActionTime(Instant.now());
            history.setStatus(true);
            reportHistoryRepository.save(history);
        } catch (Exception e) {
            String errorMessage = e.getCause() instanceof SQLException ? e.getCause().getMessage() : e.getMessage();
            throw new RuntimeException("Lỗi khi tạo báo cáo: " + errorMessage);
        }
    }

    @Transactional(readOnly = true)
    public Page<ReportResponseDto> getReportsPaged(Boolean status, Pageable pageable) {
        Page<Report> reportPage = reportRepository.findByStatus(status, pageable);
        return reportPage.map(this::convertToReportResponseDto);
    }

    @Transactional(readOnly = true)
    public Page<ReportResponseDto> getReportsByProcessingStatusId(Integer processingStatusId, Pageable pageable) {
        Page<Report> reportPage = reportRepository.findByProcessingStatusId(processingStatusId, pageable);
        return reportPage.map(this::convertToReportResponseDto);
    }

    @Transactional(readOnly = true)
    public Page<ReportResponseDto> getReportsByTargetTypeId(Integer targetTypeId, Pageable pageable) {
        Page<Report> reportPage = reportRepository.findByTargetTypeId(targetTypeId, pageable);
        return reportPage.map(this::convertToReportResponseDto);
    }

    @Transactional(readOnly = true)
    public Page<ReportResponseDto> getReportsByTargetTypeIdAndProcessingStatusId(Integer targetTypeId, Integer processingStatusId, Pageable pageable) {
        Page<Report> reportPage = reportRepository.findByTargetTypeIdAndProcessingStatusId(targetTypeId, processingStatusId, pageable);
        return reportPage.map(this::convertToReportResponseDto);
    }
    @CacheEvict(
            value = {
                    "newsfeed", "postsByUsername", "communityFeed",
                    "postsByGroup", "postsByUserInGroup", "savedPosts"
            },
            allEntries = true
    )
    @Transactional
    public void updateReportStatus(Integer reportId, UpdateReportStatusRequestDto request) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        if (currentUsername == null) {
            throw new IllegalStateException("No authenticated user found");
        }
        User admin = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new UserNotFoundException("Admin not found with username: " + currentUsername));
        if (!admin.getIsAdmin()) {
            throw new IllegalArgumentException("User is not an admin");
        }

        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found with id: " + reportId));

        try {
            System.out.println("=== [DEBUG] Calling sp_UpdateReportStatus ===");
            System.out.println("reportId = " + reportId);
            System.out.println("adminId = " + admin.getId());
            System.out.println("statusId = " + request.getProcessingStatusId());
            System.out.println("report.getTargetType() = " + (report.getTargetType() != null ? report.getTargetType().getId() : "null"));
            System.out.println("report.getTargetId() = " + report.getTargetId());

            // Gọi stored procedure để cập nhật status
            reportRepository.updateReportStatus(reportId, admin.getId(), request.getProcessingStatusId());
            
            // Refresh report object để lấy status mới nhất từ database
            report = reportRepository.findById(reportId)
                    .orElseThrow(() -> new IllegalArgumentException("Report not found after update with id: " + reportId));

            boolean isApproved = request.getProcessingStatusId() == 3;
            boolean isPostReport = report.getTargetType() != null && report.getTargetType().getId() == 1;
            boolean isReporterAI = report.getReporter() != null && Boolean.TRUE.equals(report.getReporter().getIsSystem());

            if (isApproved && isPostReport) {
                Post reportedPost = postRepository.findById(report.getTargetId())
                        .orElseThrow(() -> new IllegalArgumentException("Post not found with id: " + report.getTargetId()));

                // Với báo cáo từ AI
                if (isReporterAI) {
                    try {
                        postFlagRepository.findByPostId(reportedPost.getId()).ifPresent(postFlagRepository::delete);
                        postAIModerationRepository.findByPostId(reportedPost.getId()).ifPresent(postAIModerationRepository::delete);

                        List<Integer> commentIds = commentRepository.findIdsByPostId(reportedPost.getId());
                        if (!commentIds.isEmpty()) {
                            reactionRepository.deleteAllByCommentIds(commentIds);
                        }

                        commentRepository.deleteAllByPostId(reportedPost.getId());

                        reactionRepository.deleteAllByPostId(reportedPost.getId());

                        mediaRepository.deleteAllPostMedia(reportedPost.getId());

                        postRepository.delete(reportedPost);
                        String reasonContent = report.getReason() != null
                                ? report.getReason().getDescription()
                                : "vi phạm tiêu chuẩn cộng đồng";

                        String ownerMessage = "Bài viết của bạn đã bị xóa do: \"" + reasonContent + "\". "
                                + "Vui lòng đảm bảo các nội dung bạn đăng tuân thủ tiêu chuẩn cộng đồng của chúng tôi.";

                        messagingTemplate.convertAndSend(
                                "/topic/notifications/" + reportedPost.getOwner().getId(),
                                Map.of(
                                        "id", reportedPost.getId(),
                                        "message", ownerMessage,
                                        "type", "POST_REMOVED",
                                        "targetId", reportedPost.getId(),
                                        "targetType", "POST",
                                        "adminId", admin.getId(),
                                        "adminDisplayName", admin.getDisplayName(),
                                        "createdAt", System.currentTimeMillis() / 1000,
                                        "status", "unread"
                                )
                        );

                        notificationService.sendNotification(
                                reportedPost.getOwner().getId(),      // Người nhận thông báo
                                "POST_REMOVED",                       // Loại thông báo
                                ownerMessage,                         // Nội dung
                                admin.getId(),                        // Người gửi (admin)
                                "PROFILE",
                                null
                        );
                        System.out.println("✅ [AI MODERATION] Post " + reportedPost.getId() + " deleted by AI report approval.");
                    } catch (Exception e) {
                        System.err.println("❌ Error during AI auto-moderation delete: " + e.getMessage());
                    }
                }
                // Với báo cáo người dùng
                else {
                    try {
                        List<Integer> commentIds = commentRepository.findIdsByPostId(reportedPost.getId());
                        if (!commentIds.isEmpty()) {
                            reactionRepository.deleteAllByCommentIds(commentIds);
                        }

                        commentRepository.deleteAllByPostId(reportedPost.getId());

                        reactionRepository.deleteAllByPostId(reportedPost.getId());

                        mediaRepository.deleteAllPostMedia(reportedPost.getId());

                        postFlagRepository.findByPostId(reportedPost.getId()).ifPresent(postFlagRepository::delete);

                        postAIModerationRepository.findByPostId(reportedPost.getId()).ifPresent(postAIModerationRepository::delete);

                        postRepository.delete(reportedPost);

                        String reasonContent = report.getReason() != null
                                ? report.getReason().getDescription()
                                : "vi phạm tiêu chuẩn cộng đồng";

                        String ownerMessage = "Bài viết của bạn đã bị xóa do: \"" + reasonContent + "\". "
                                + "Vui lòng đảm bảo các nội dung bạn đăng tuân thủ tiêu chuẩn cộng đồng của chúng tôi.";

                        messagingTemplate.convertAndSend(
                                "/topic/notifications/" + reportedPost.getOwner().getId(),
                                Map.of(
                                        "id", reportedPost.getId(),
                                        "message", ownerMessage,
                                        "type", "POST_REMOVED",
                                        "targetId", reportedPost.getId(),
                                        "targetType", "POST",
                                        "adminId", admin.getId(),
                                        "adminDisplayName", admin.getDisplayName(),
                                        "createdAt", System.currentTimeMillis() / 1000,
                                        "status", "unread"
                                )
                        );

                        notificationService.sendNotification(
                                reportedPost.getOwner().getId(),      // Người nhận
                                "POST_REMOVED",                       // Type
                                ownerMessage,                         // Nội dung
                                admin.getId(),                        // Người gửi (admin)
                                "PROFILE",                            // Target type
                                null                                  // Avatar URL nếu cần
                        );
                        System.out.println("✅ [USER MODERATION] Post " + reportedPost.getId() + " deleted by user report approval.");
                    } catch (Exception e) {
                        System.err.println("❌ Error during user report moderation delete: " + e.getMessage());
                    }
                }
            }

            String message = switch (request.getProcessingStatusId()) {
                case 1 -> "Báo cáo của bạn (ID: " + reportId + ") đang chờ xử lý bởi " + admin.getDisplayName();
                case 2 -> "Báo cáo của bạn (ID: " + reportId + ") đang được xem xét bởi " + admin.getDisplayName();
                case 3 -> "Báo cáo của bạn (ID: " + reportId + ") đã được duyệt bởi " + admin.getDisplayName();
                case 4 -> "Báo cáo của bạn (ID: " + reportId + ") đã bị từ chối bởi " + admin.getDisplayName();
                default -> "Báo cáo của bạn (ID: " + reportId + ") đã được cập nhật bởi " + admin.getDisplayName();
            };

            // Kiểm tra và thông báo nếu target bị tự động block (cho báo cáo được duyệt)
            if (request.getProcessingStatusId() == 3 && report.getTargetType() != null) {
                // Đếm số lần target_id này bị báo cáo và được duyệt
                long approvedReportsForTarget = reportRepository.countByTargetIdAndTargetTypeIdAndProcessingStatusIdAndStatus(
                        report.getTargetId(), 
                        report.getTargetType().getId(), 
                        3, // Approved status
                        true
                );
                
                System.out.println("[DEBUG] Target ID: " + report.getTargetId());
                System.out.println("[DEBUG] Target Type: " + report.getTargetType().getName());
                System.out.println("[DEBUG] Approved reports for this target: " + approvedReportsForTarget);
                
                // Nếu target này đã bị báo cáo và duyệt đúng 3 lần thì auto-block
                if (approvedReportsForTarget == 3) {
                    System.out.println("[DEBUG] Target has exactly 3 approved reports, proceeding with auto-block");
                    
                    // Chỉ auto-block nếu target là USER hoặc là POST (block chủ sở hữu post)
                    final Integer userIdToBlock;
                     
                     if (report.getTargetType().getId() == 4) { // USER target
                          userIdToBlock = report.getTargetId();
                      } else if (report.getTargetType().getId() == 1) { // POST target
                          // Tìm chủ sở hữu của post để block
                           Post post = postRepository.findById(report.getTargetId()).orElse(null);
                           if (post != null && post.getOwner() != null) {
                               userIdToBlock = post.getOwner().getId();
                           } else {
                               userIdToBlock = null;
                           }
                      } else {
                          userIdToBlock = null;
                      }
                    
                    if (userIdToBlock != null) {
                        try {
                            User targetUser = userRepository.findById(userIdToBlock)
                                .orElseThrow(() -> new UserNotFoundException("Target user not found with id: " + userIdToBlock));
                            
                            System.out.println("[DEBUG] Found target user: " + targetUser.getUsername() + ", Status: " + targetUser.getStatus());
                            
                            // Chỉ khóa nếu user chưa bị khóa
                            if (targetUser.getStatus()) {
                                System.out.println("[DEBUG] Calling autoBlockUser stored procedure...");
                                System.out.println("[DEBUG] Parameters: userIdToBlock=" + userIdToBlock + ", adminId=" + admin.getId());
                                
                                // Gọi stored procedure để auto-block user
                                reportRepository.autoBlockUser(userIdToBlock, admin.getId());
                                
                                System.out.println("=== AUTO-BLOCK USER SUCCESSFUL ====");
                                System.out.println("User ID: " + userIdToBlock + " (" + targetUser.getUsername() + ") has been automatically blocked due to 3 approved reports on target ID: " + report.getTargetId());
                                
                                // Kiểm tra lại status sau khi block
                                User updatedUser = userRepository.findById(userIdToBlock).orElse(null);
                                if (updatedUser != null) {
                                    System.out.println("[DEBUG] User status after auto-block: " + updatedUser.getStatus());
                                }
                            } else {
                                System.out.println("[DEBUG] User is already blocked, skipping auto-block");
                            }
                        } catch (Exception e) {
                            System.err.println("❌ ERROR auto-blocking user: " + e.getMessage());
                            System.err.println("❌ Exception type: " + e.getClass().getSimpleName());
                            if (e.getCause() != null) {
                                System.err.println("❌ Root cause: " + e.getCause().getMessage());
                            }
                            e.printStackTrace();
                        }
                    }
                } else {
                    System.out.println("[DEBUG] Target has " + approvedReportsForTarget + " approved reports - no auto-block needed");
                }
            }

            // Gửi thông báo WebSocket duy nhất
            messagingTemplate.convertAndSend(
                    "/topic/notifications/" + report.getReporter().getId(),
                    Map.of(
                            "id", reportId,
                            "message", message,
                            "type", "REPORT_STATUS_UPDATED",
                            "targetId", admin.getId(),
                            "targetType", "PROFILE",
                            "adminId", admin.getId(),
                            "adminDisplayName", admin.getDisplayName() != null ? admin.getDisplayName() : admin.getUsername(),
                            "createdAt", System.currentTimeMillis() / 1000,
                            "status", request.getProcessingStatusId() == 3 ? "read" : "unread"
                    )
            );

            // Lưu thông báo vào database
            notificationService.sendNotification(
                    report.getReporter().getId(),
                    "REPORT_STATUS_UPDATED",
                    message,
                    admin.getId(),
                    "PROFILE"
            );

            if (request.getProcessingStatusId() == 4) { // Rejected
                Instant startOfToday = LocalDate.now()
                        .atStartOfDay(ZoneId.systemDefault())
                        .toInstant();

                long rejectedCount = reportRepository.countByReporterIdAndProcessingStatusIdAndReportTime(
                        report.getReporter().getId(), 4, startOfToday
                );
                if (rejectedCount >= 3) {
                    String abuseMessage = "Bạn đã gửi quá nhiều báo cáo không hợp lệ hôm nay. Vui lòng kiểm tra lại hành vi báo cáo của bạn.";
                    notificationService.sendNotification(
                            report.getReporter().getId(),
                            "REPORT_ABUSE_WARNING",
                            abuseMessage,
                            admin.getId(),
                            "PROFILE"
                    );
                    messagingTemplate.convertAndSend(
                            "/topic/notifications/" + report.getReporter().getId(),
                            Map.of(
                                    "id", reportId,
                                    "message", abuseMessage,
                                    "type", "REPORT_ABUSE_WARNING",
                                    "targetId", admin.getId(),
                                    "targetType", "PROFILE",
                                    "createdAt", System.currentTimeMillis() / 1000,
                                    "status", "unread"
                            )
                    );
                }
            }
        } catch (Exception e) {
            e.printStackTrace(); // In chi tiết lỗi ra console
            String message = e.getCause() instanceof SQLException
                    ? e.getCause().getMessage()
                    : e.getMessage();

            throw new RuntimeException("❌ Lỗi khi cập nhật trạng thái báo cáo: " + message);
        }
    }

    @Transactional
    public void deleteReport(Integer reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found with id: " + reportId));
        ReportStatus status = reportStatusRepository.findById(4)
                .orElseThrow(() -> new IllegalArgumentException("Report status not found with id: 4"));

        try {
            ReportHistory history = new ReportHistory();
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User admin = userRepository.findByUsername(currentUsername)
                    .orElseThrow(() -> new UserNotFoundException("Admin not found"));
            history.setReporter(admin);
            history.setReport(report);
            history.setProcessingStatus(status);
            history.setActionTime(Instant.now());
            history.setStatus(true);
            reportHistoryRepository.save(history);

            String message = "Báo cáo của bạn (ID: " + reportId + ") đã bị xóa bởi " + admin.getDisplayName();
            messagingTemplate.convertAndSend(
                    "/topic/notifications/" + report.getReporter().getId(),
                    Map.of(
                            "id", reportId,
                            "message", message,
                            "type", "REPORT_DELETED",
                            "targetId", admin.getId(),
                            "targetType", "PROFILE", // Sửa: Gửi targetType dạng chuỗi
                            "adminId", admin.getId(),
                            "adminDisplayName", admin.getDisplayName() != null ? admin.getDisplayName() : admin.getUsername(),
                            "createdAt", System.currentTimeMillis() / 1000,
                            "status", "unread"
                    )
            );

            notificationService.sendNotification(
                    report.getReporter().getId(),
                    "REPORT_DELETED",
                    message,
                    admin.getId(),
                    "PROFILE"
            );

            report.setStatus(false);
            reportRepository.save(report);
            reportRepository.delete(report);
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete report: " + e.getMessage());
        }
    }

    public ReportResponseDto getReportById(Integer reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found with id: " + reportId));
        return convertToReportResponseDto(report);
    }

    private ReportResponseDto convertToReportResponseDto(Report report) {
        ReportResponseDto dto = new ReportResponseDto();
        dto.setId(report.getId());
        dto.setReporterId(report.getReporter() != null ? report.getReporter().getId() : null);
        dto.setReporterUsername(report.getReporter() != null ? report.getReporter().getUsername() : null);
        dto.setTargetId(report.getTargetId());
        dto.setTargetTypeId(report.getTargetType() != null ? report.getTargetType().getId() : null);
        dto.setTargetTypeName(report.getTargetType() != null ? report.getTargetType().getName() : null);
        if (report.getReason() != null) {
            ReportReasonDto reasonDto = new ReportReasonDto();
            reasonDto.setId(report.getReason().getId());
            reasonDto.setName(report.getReason().getName());
            reasonDto.setDescription(report.getReason().getDescription());
            reasonDto.setStatus(report.getReason().getStatus());
            dto.setReason(reasonDto);
        }
        dto.setProcessingStatusId(report.getProcessingStatus() != null ? report.getProcessingStatus().getId() : null);
        dto.setProcessingStatusName(report.getProcessingStatus() != null ? report.getProcessingStatus().getName() : null);
        dto.setReportTime(report.getReportTime());
        dto.setStatus(report.getStatus());

        // Thêm logic để lấy content và imageUrls nếu là báo cáo bài viết
        if (report.getTargetType() != null && report.getTargetType().getId() == 1) { // 1 = POST
            Post post = postRepository.findById(report.getTargetId()).orElse(null);
            if (post != null) {
                dto.setContent(post.getContent());
                // Lấy danh sách mediaUrl từ MediaRepository
                List<String> imageUrls = mediaRepository
                        .findByTargetIdAndTargetType_CodeAndMediaType_NameAndStatus(
                                post.getId(), "POST", "image", true)
                        .stream()
                        .map(Media::getMediaUrl)
                        .collect(Collectors.toList());
                dto.setImageUrls(imageUrls);
            } else {
                dto.setContent(null);
                dto.setImageUrls(Collections.emptyList());
            }
        } else {
            dto.setContent(null);
            dto.setImageUrls(Collections.emptyList());
        }

        return dto;
    }


    public long countAllReports() {
        return reportRepository.count();
    }

    @Transactional(readOnly = true)
    public Page<ReportResponseDto> getReportsByReporterTypeAIAndTargetTypeId(Integer targetTypeId, Integer processingStatusId, Pageable pageable) {
        Page<Report> reportPage = reportRepository.findByReporterTypeAIAndTargetTypeId(targetTypeId, processingStatusId, pageable);
        return reportPage.map(this::convertToReportResponseDto);
    }

}