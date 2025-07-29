package com.example.social_media.service;

import com.example.social_media.dto.report.CreateReportRequestDto;
import com.example.social_media.dto.report.ReportResponseDto;
import com.example.social_media.dto.report.UpdateReportStatusRequestDto;
import com.example.social_media.dto.report.ReportReasonDto;
import com.example.social_media.entity.*;
import com.example.social_media.exception.NotFoundException;
import com.example.social_media.exception.UnauthorizedException;
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
    private final PostRepository postRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;
    private final PostFlagRepository postFlagRepository;
    private final PostAIModerationRepository postAIModerationRepository;
    private final MediaRepository mediaRepository;
    private final CommentRepository  commentRepository;
    private final ReactionRepository reactionRepository;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final MediaService mediaService;

    private static final int MAX_REPORTS_PER_DAY = 3;

    public ReportService(
            ReportRepository reportRepository,
            UserRepository userRepository,
            ReportReasonRepository reportReasonRepository,
            ReportStatusRepository reportStatusRepository,
            ReportHistoryRepository reportHistoryRepository,
            PostRepository postRepository,
            SimpMessagingTemplate messagingTemplate,
            NotificationService notificationService,
            PostFlagRepository postFlagRepository,
            PostAIModerationRepository postAIModerationRepository,
            MediaRepository mediaRepository,
            CommentRepository commentRepository,
            ReactionRepository reactionRepository,
            GroupRepository groupRepository,
            GroupMemberRepository groupMemberRepository,
            MediaService mediaService
    ) {
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
        this.reportReasonRepository = reportReasonRepository;
        this.reportStatusRepository = reportStatusRepository;
        this.reportHistoryRepository = reportHistoryRepository;
        this.postRepository = postRepository;
        this.messagingTemplate = messagingTemplate;
        this.notificationService = notificationService;
        this.postFlagRepository = postFlagRepository;
        this.postAIModerationRepository = postAIModerationRepository;
        this.mediaRepository = mediaRepository;
        this.commentRepository = commentRepository;
        this.reactionRepository = reactionRepository;
        this.groupRepository = groupRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.mediaService = mediaService;
    }

    @Transactional(readOnly = true)
    public Page<ReportResponseDto> getReportsByGroupId(Integer groupId, Boolean status, Pageable pageable) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new NotFoundException("Nhóm không tồn tại"));
        Page<Report> reportPage = reportRepository.findByGroupIdAndTargetTypeId(groupId, status, pageable);
        return reportPage.map(this::convertToReportResponseDto);
    }

    @Transactional
    public void createReport(CreateReportRequestDto request) {
        User reporter = userRepository.findById(request.getReporterId())
                .orElseThrow(() -> new UserNotFoundException("Người dùng không tồn tại với id: " + request.getReporterId()));

        ReportReason reason = reportReasonRepository.findById(request.getReasonId())
                .orElseThrow(() -> new IllegalArgumentException("Lý do báo cáo không tồn tại với id: " + request.getReasonId()));

        // Kiểm tra báo cáo trùng lặp
        boolean reportExists = reportRepository.existsByReporterIdAndTargetIdAndTargetTypeIdAndStatus(
                request.getReporterId(), request.getTargetId(), request.getTargetTypeId(), true);
        if (reportExists) {
            throw new IllegalArgumentException("Bạn đã báo cáo nội dung này trước đó");
        }

        // Kiểm tra quyền báo cáo bài viết trong nhóm private
        if (request.getTargetTypeId() == 1) {
            Post post = postRepository.findById(request.getTargetId())
                    .orElseThrow(() -> new IllegalArgumentException("Bài viết không tồn tại với id: " + request.getTargetId()));
            if (post.getGroup() != null && "private".equalsIgnoreCase(post.getGroup().getPrivacyLevel())) {
                boolean isMember = groupMemberRepository.existsById_GroupIdAndId_UserIdAndStatusTrueAndInviteStatus(
                        post.getGroup().getId(), reporter.getId(), "ACCEPTED");
                if (!isMember) {
                    throw new UnauthorizedException("Bạn không có quyền báo cáo bài viết trong nhóm private này");
                }
            }
        }

        try {
            ReportStatus status = reportStatusRepository.findById(1)
                    .orElseThrow(() -> new IllegalArgumentException("Trạng thái báo cáo không tồn tại với id: 1"));

            Integer reportId = reportRepository.addReport(
                    request.getReporterId(),
                    request.getTargetId(),
                    request.getTargetTypeId(),
                    request.getReasonId(),
                    1,
                    true
            );

            Report report = reportRepository.findById(reportId)
                    .orElseThrow(() -> new IllegalArgumentException("Báo cáo không tồn tại với id: " + reportId));

            // Kiểm tra nếu báo cáo là bài viết
            if (request.getTargetTypeId() == 1) {
                Post post = postRepository.findById(request.getTargetId())
                        .orElseThrow(() -> new IllegalArgumentException("Bài viết không tồn tại với id: " + request.getTargetId()));

                if (post.getGroup() != null) {
                    Integer groupId = post.getGroup().getId();
                    List<GroupMember> admins = groupMemberRepository.findById_GroupIdAndIsAdminTrue(groupId);
                    for (GroupMember admin : admins) {
                        String message = "Bài viết trong nhóm " + post.getGroup().getName() + " đã bị báo cáo bởi " + reporter.getUsername() +
                                " với lý do: " + reason.getName();
                        notificationService.sendNotification(
                                admin.getUser().getId(),
                                "GROUP_POST_REPORT",
                                message,
                                groupId,
                                "GROUP",
                                mediaService.getGroupAvatarUrl(groupId)
                        );
                        messagingTemplate.convertAndSend(
                                "/topic/notifications/" + admin.getUser().getId(),
                                Map.of(
                                        "id", reportId,
                                        "message", message,
                                        "type", "GROUP_POST_REPORT",
                                        "targetId", request.getTargetId(),
                                        "targetType", "POST",
                                        "groupId", groupId,
                                        "groupName", post.getGroup().getName(),
                                        "createdAt", System.currentTimeMillis() / 1000,
                                        "status", "unread"
                                )
                        );
                    }
                    // Gửi thông báo tới owner nhóm nếu owner không nằm trong danh sách admin
                    if (!admins.stream().anyMatch(admin -> admin.getUser().getId().equals(post.getGroup().getOwner().getId()))) {
                        String message = "Bài viết trong nhóm " + post.getGroup().getName() + " đã bị báo cáo bởi " + reporter.getUsername() +
                                " với lý do: " + reason.getName();
                        notificationService.sendNotification(
                                post.getGroup().getOwner().getId(),
                                "GROUP_POST_REPORT",
                                message,
                                groupId,
                                "GROUP",
                                mediaService.getGroupAvatarUrl(groupId)
                        );
                        messagingTemplate.convertAndSend(
                                "/topic/notifications/" + post.getGroup().getOwner().getId(),
                                Map.of(
                                        "id", reportId,
                                        "message", message,
                                        "type", "GROUP_POST_REPORT",
                                        "targetId", request.getTargetId(),
                                        "targetType", "POST",
                                        "groupId", groupId,
                                        "groupName", post.getGroup().getName(),
                                        "createdAt", System.currentTimeMillis() / 1000,
                                        "status", "unread"
                                )
                        );
                    }
                } else {
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
                }
            } else {
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
            }

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
            value = {"newsfeed", "postsByUsername", "communityFeed", "postsByGroup", "postsByUserInGroup", "savedPosts"},
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

        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found with id: " + reportId));

        // Kiểm tra quyền xử lý báo cáo
        boolean isSystemAdmin = admin.getIsAdmin();
        boolean isGroupAdmin = false;
        Integer groupId = null;

        if (report.getTargetType() != null && report.getTargetType().getId() == 1) { // Báo cáo bài viết
            Post post = postRepository.findById(report.getTargetId())
                    .orElseThrow(() -> new IllegalArgumentException("Post not found with id: " + report.getTargetId()));

            if (post.getGroup() != null) {
                groupId = post.getGroup().getId();
                isGroupAdmin = groupMemberRepository.isGroupAdmin(groupId, admin.getId())
                        || post.getGroup().getOwner().getId().equals(admin.getId());

                // Nếu bài viết thuộc group -> chỉ admin group được xử lý
                if (!isGroupAdmin) {
                    throw new UnauthorizedException("Bạn không có quyền xử lý báo cáo bài viết trong group này");
                }
            } else {
                // Nếu bài viết không thuộc group -> chỉ admin hệ thống được xử lý
                if (!isSystemAdmin) {
                    throw new UnauthorizedException("Bạn không có quyền xử lý báo cáo này");
                }
            }
        } else {
            // Các loại report khác (User, Page, v.v...) -> chỉ admin hệ thống được xử lý
            if (!isSystemAdmin) {
                throw new UnauthorizedException("Bạn không có quyền xử lý báo cáo này");
            }
        }

        try {
            System.out.println("=== [DEBUG] Calling sp_UpdateReportStatus ===");
            System.out.println("reportId = " + reportId);
            System.out.println("adminId = " + admin.getId());
            System.out.println("statusId = " + request.getProcessingStatusId());
            System.out.println("report.getTargetType() = " + (report.getTargetType() != null ? report.getTargetType().getId() : "null"));
            System.out.println("report.getTargetId() = " + report.getTargetId());

            // Gọi stored procedure để cập nhật status và auto-block nếu cần
            reportRepository.updateReportStatus(reportId, admin.getId(), request.getProcessingStatusId());

            // Refresh report object để lấy status mới nhất từ database
            final Report updatedReport = reportRepository.findById(reportId)
                    .orElseThrow(() -> new IllegalArgumentException("Report not found after update with id: " + reportId));

            boolean isApproved = request.getProcessingStatusId() == 3;
            boolean isPostReport = updatedReport.getTargetType() != null && updatedReport.getTargetType().getId() == 1;
            boolean isReporterAI = updatedReport.getReporter() != null && Boolean.TRUE.equals(updatedReport.getReporter().getIsSystem());

            System.out.println("[DEBUG] === REPORT STATUS UPDATE DEBUG ===");
            System.out.println("[DEBUG] Processing Status ID: " + request.getProcessingStatusId());
            System.out.println("[DEBUG] Is Approved: " + isApproved);
            System.out.println("[DEBUG] Is Post Report: " + isPostReport);
            System.out.println("[DEBUG] Target Type: " + (updatedReport.getTargetType() != null ? updatedReport.getTargetType().getName() : "null"));
            System.out.println("[DEBUG] Is Reporter AI: " + isReporterAI);

            if (isApproved && isPostReport) {
                System.out.println("[DEBUG] ✅ Report approved for POST - Starting post deletion process");
                System.out.println("[DEBUG] Target ID: " + updatedReport.getTargetId());
                System.out.println("[DEBUG] Is AI Reporter: " + isReporterAI);

                Post reportedPost = postRepository.findById(updatedReport.getTargetId())
                        .orElseThrow(() -> new IllegalArgumentException("Post not found with id: " + updatedReport.getTargetId()));

                // Xóa bài viết và các dữ liệu liên quan
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

                    String reasonContent = updatedReport.getReason() != null
                            ? updatedReport.getReason().getDescription()
                            : "vi phạm tiêu chuẩn cộng đồng";

                    String ownerMessage = "Bài viết của bạn" + (groupId != null ? " trong nhóm " + reportedPost.getGroup().getName() : "") +
                            " đã bị xóa do: \"" + reasonContent + "\". " +
                            "Vui lòng đảm bảo các nội dung bạn đăng tuân thủ tiêu chuẩn cộng đồng của chúng tôi.";

                    // Gửi thông báo tới chủ bài viết
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
                                    "groupId", groupId,
                                    "createdAt", System.currentTimeMillis() / 1000,
                                    "status", "unread"
                            )
                    );

                    notificationService.sendNotification(
                            reportedPost.getOwner().getId(),
                            "POST_REMOVED",
                            ownerMessage,
                            admin.getId(),
                            "PROFILE",
                            null
                    );

                    // Gửi thông báo tới admin nhóm (bao gồm owner)
                    if (groupId != null) {
                        List<GroupMember> admins = groupMemberRepository.findById_GroupIdAndIsAdminTrue(groupId);
                        for (GroupMember groupAdmin : admins) {
                            String adminMessage = "Bài viết trong nhóm " + reportedPost.getGroup().getName() +
                                    " đã bị xóa do: \"" + reasonContent + "\" bởi " + admin.getDisplayName();
                            notificationService.sendNotification(
                                    groupAdmin.getUser().getId(),
                                    "GROUP_POST_REMOVED",
                                    adminMessage,
                                    groupId,
                                    "GROUP",
                                    mediaService.getGroupAvatarUrl(groupId)
                            );
                            messagingTemplate.convertAndSend(
                                    "/topic/notifications/" + groupAdmin.getUser().getId(),
                                    Map.of(
                                            "id", reportedPost.getId(),
                                            "message", adminMessage,
                                            "type", "GROUP_POST_REMOVED",
                                            "targetId", reportedPost.getId(),
                                            "targetType", "POST",
                                            "groupId", groupId,
                                            "createdAt", System.currentTimeMillis() / 1000,
                                            "status", "unread"
                                    )
                            );
                        }
                    }

                    System.out.println("✅ [" + (isReporterAI ? "AI" : "USER") + " MODERATION] Post " + reportedPost.getId() + " deleted.");
                } catch (Exception e) {
                    System.err.println("❌ Error during " + (isReporterAI ? "AI" : "user") + " moderation delete: " + e.getMessage());
                }
            }

            // Kiểm tra và thông báo nếu target bị tự động block
            if (request.getProcessingStatusId() == 3 && updatedReport.getTargetType() != null) {
                System.out.println("[DEBUG] === AUTO-BLOCK LOGIC START ===");
                System.out.println("[DEBUG] Target ID: " + updatedReport.getTargetId());
                System.out.println("[DEBUG] Target Type ID: " + updatedReport.getTargetType().getId());
                System.out.println("[DEBUG] Target Type Name: " + updatedReport.getTargetType().getName());

                long approvedReportsForTarget = reportRepository.countByTargetIdAndTargetTypeIdAndProcessingStatusIdAndStatus(
                        updatedReport.getTargetId(),
                        updatedReport.getTargetType().getId(),
                        3,
                        true
                );

                System.out.println("[DEBUG] Approved reports for this target: " + approvedReportsForTarget);

                if (updatedReport.getTargetType().getId() == 4) { // USER target
                    System.out.println("[DEBUG] This is a USER report - counting all approved reports for user ID: " + updatedReport.getTargetId());
                } else if (updatedReport.getTargetType().getId() == 1) { // POST target
                    System.out.println("[DEBUG] This is a POST report - will check post owner for auto-block");
                    Post reportedPost = postRepository.findById(updatedReport.getTargetId()).orElse(null);
                    if (reportedPost != null && reportedPost.getOwner() != null) {
                        System.out.println("[DEBUG] Post owner ID: " + reportedPost.getOwner().getId());
                        System.out.println("[DEBUG] Post owner username: " + reportedPost.getOwner().getUsername());

                        long userReports = reportRepository.countByTargetIdAndTargetTypeIdAndProcessingStatusIdAndStatus(
                                reportedPost.getOwner().getId(), 4, 3, true);
                        long postReports = reportRepository.countApprovedPostReportsByUserId(reportedPost.getOwner().getId());
                        long totalApprovedReports = userReports + postReports;

                        System.out.println("[DEBUG] User reports approved: " + userReports);
                        System.out.println("[DEBUG] Post reports approved: " + postReports);
                        System.out.println("[DEBUG] Total approved reports for user: " + totalApprovedReports);

                        approvedReportsForTarget = totalApprovedReports;
                    }
                }

                if (approvedReportsForTarget == 3) {
                    System.out.println("[DEBUG] Target has exactly 3 approved reports, proceeding with auto-block");

                    final Integer userIdToBlock;
                    if (updatedReport.getTargetType().getId() == 4) { // USER target
                        userIdToBlock = updatedReport.getTargetId();
                    } else if (updatedReport.getTargetType().getId() == 1) { // POST target
                        Post post = postRepository.findById(updatedReport.getTargetId()).orElse(null);
                        userIdToBlock = (post != null && post.getOwner() != null) ? post.getOwner().getId() : null;
                    } else {
                        userIdToBlock = null;
                    }

                    if (userIdToBlock != null) {
                        try {
                            User targetUser = userRepository.findById(userIdToBlock)
                                    .orElseThrow(() -> new UserNotFoundException("Target user not found with id: " + userIdToBlock));

                            System.out.println("[DEBUG] Found target user: " + targetUser.getUsername() + ", Status: " + targetUser.getStatus());

                            if (targetUser.getStatus()) {
                                System.out.println("[DEBUG] Calling autoBlockUser stored procedure...");
                                reportRepository.autoBlockUser(userIdToBlock, admin.getId());

                                System.out.println("=== AUTO-BLOCK USER SUCCESSFUL ====");
                                System.out.println("User ID: " + userIdToBlock + " (" + targetUser.getUsername() + ") has been automatically blocked due to 3 approved reports on target ID: " + updatedReport.getTargetId());

                                userRepository.findById(userIdToBlock).ifPresent(updatedUser -> System.out.println("[DEBUG] User status after auto-block: " + updatedUser.getStatus()));
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

            // Auto-block logic is now handled by the stored procedure sp_UpdateReportStatus
            System.out.println("[DEBUG] Auto-block logic handled by stored procedure");

            String message = switch (request.getProcessingStatusId()) {
                case 1 -> "Báo cáo của bạn (ID: " + reportId + ") đang chờ xử lý bởi " + admin.getDisplayName();
                case 2 -> "Báo cáo của bạn (ID: " + reportId + ") đang được xem xét bởi " + admin.getDisplayName();
                case 3 -> "Báo cáo của bạn (ID: " + reportId + ") đã được duyệt bởi " + admin.getDisplayName();
                case 4 -> "Báo cáo của bạn (ID: " + reportId + ") đã bị từ chối bởi " + admin.getDisplayName();
                default -> "Báo cáo của bạn (ID: " + reportId + ") đã được cập nhật bởi " + admin.getDisplayName();
            };

            messagingTemplate.convertAndSend(
                    "/topic/notifications/" + updatedReport.getReporter().getId(),
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

            notificationService.sendNotification(
                    updatedReport.getReporter().getId(),
                    "REPORT_STATUS_UPDATED",
                    message,
                    admin.getId(),
                    "PROFILE"
            );

            // Kiểm tra báo cáo bị từ chối
            if (request.getProcessingStatusId() == 4) {
                Instant startOfToday = LocalDate.now()
                        .atStartOfDay(ZoneId.systemDefault())
                        .toInstant();

                long rejectedCount = reportRepository.countByReporterIdAndProcessingStatusIdAndReportTime(
                        updatedReport.getReporter().getId(), 4, startOfToday
                );
                if (rejectedCount >= 3) {
                    String abuseMessage = "Bạn đã gửi quá nhiều báo cáo không hợp lệ hôm nay. Vui lòng kiểm tra lại hành vi báo cáo của bạn.";
                    notificationService.sendNotification(
                            updatedReport.getReporter().getId(),
                            "REPORT_ABUSE_WARNING",
                            abuseMessage,
                            admin.getId(),
                            "PROFILE"
                    );
                    messagingTemplate.convertAndSend(
                            "/topic/notifications/" + updatedReport.getReporter().getId(),
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

            // Lưu lịch sử báo cáo
            ReportHistory history = new ReportHistory();
            history.setReporter(admin);
            history.setReport(updatedReport);
            history.setProcessingStatus(reportStatusRepository.findById(request.getProcessingStatusId())
                    .orElseThrow(() -> new IllegalArgumentException("Trạng thái báo cáo không tồn tại")));
            history.setActionTime(Instant.now());
            history.setStatus(true);
            reportHistoryRepository.save(history);
        } catch (Exception e) {
            e.printStackTrace();
            String message = e.getCause() instanceof SQLException
                    ? e.getCause().getMessage()
                    : e.getMessage();
            throw new RuntimeException("❌ Lỗi khi cập nhật trạng thái báo cáo: " + message);
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

        // ✅ Nếu report là bài viết
        if (report.getTargetType() != null && report.getTargetType().getId() == 1) {
            postRepository.findById(report.getTargetId()).ifPresent(post -> {
                dto.setContent(post.getContent());
                List<String> imageUrls = mediaRepository
                        .findByTargetIdAndTargetType_CodeAndMediaType_NameAndStatus(
                                post.getId(), "POST", "image", true)
                        .stream()
                        .map(Media::getMediaUrl)
                        .collect(Collectors.toList());
                dto.setImageUrls(imageUrls);

                if (post.getGroup() != null) {
                    dto.setGroupId(post.getGroup().getId());
                    dto.setGroupName(post.getGroup().getName());
                }
            });
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