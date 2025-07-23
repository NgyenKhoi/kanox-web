    package com.example.social_media.service.AI;

    import com.example.social_media.dto.post.FlagResultDto;
    import com.example.social_media.entity.*;
    import com.example.social_media.repository.TargetTypeRepository;
    import com.example.social_media.repository.UserRepository;
    import com.example.social_media.repository.post.PostAIModerationRepository;
    import com.example.social_media.repository.post.PostRepository;
    import com.example.social_media.repository.report.ReportHistoryRepository;
    import com.example.social_media.repository.report.ReportReasonRepository;
    import com.example.social_media.repository.report.ReportRepository;
    import com.example.social_media.repository.report.ReportStatusRepository;
    import com.example.social_media.service.MediaService;
    import com.example.social_media.service.NotificationService;
    import lombok.RequiredArgsConstructor;
    import lombok.extern.slf4j.Slf4j;
    import org.springframework.data.domain.Pageable;
    import org.springframework.messaging.simp.SimpMessagingTemplate;
    import org.springframework.stereotype.Service;
    import org.springframework.transaction.annotation.Transactional;

    import java.time.Instant;
    import java.util.Comparator;
    import java.util.List;
    import java.util.Map;
    import java.util.Optional;

    @Slf4j
    @Service
    @RequiredArgsConstructor
    public class PostModerationService {

        private final VertexAIService vertexAIService;
        private final PostRepository postRepository;
        private final PostAIModerationRepository postAIModerationRepository;
        private final ReportRepository reportRepository;
        private final ReportReasonRepository reportReasonRepository;
        private final ReportHistoryRepository reportHistoryRepository;
        private final ReportStatusRepository reportStatusRepository;
        private final TargetTypeRepository targetTypeRepository;
        private final UserRepository userRepository;
        private final NotificationService notificationService;
        private final MediaService mediaService;
        private final SimpMessagingTemplate messagingTemplate;

        private static final double MIN_CONFIDENCE_THRESHOLD = 0.75;

        @Transactional
        public void moderatePost(Integer postId) {
            Optional<Post> optionalPost = postRepository.findById(postId);
            if (optionalPost.isEmpty()) {
                log.warn("Không tìm thấy bài viết với id = {}", postId);
                return;
            }

            Post post = optionalPost.get();
            Optional<FlagResultDto> resultOpt = vertexAIService.analyzePost(post.getContent());

            if (resultOpt.isEmpty()) {
                log.warn("Không thể phân tích bài viết bằng AI cho postId = {}", postId);
                return;
            }

            FlagResultDto result = resultOpt.get();
            double confidenceScore = 1.0; // hoặc lấy từ result nếu có

            PostAIModeration moderation = new PostAIModeration();
            moderation.setPost(post);
            moderation.setChecked(true);
            moderation.setCheckedAt(Instant.now());

            if (!result.isViolation() || confidenceScore < MIN_CONFIDENCE_THRESHOLD) {
                moderation.setFlagged(false);
                postAIModerationRepository.save(moderation);
                log.info("Bài viết #{} không vi phạm hoặc confidence score {} dưới ngưỡng {}", postId, confidenceScore, MIN_CONFIDENCE_THRESHOLD);
                return;
            }

            // Gắn flag và báo cáo nếu vi phạm
            moderation.setFlagged(true);

            String joinedReasons = String.join(", ", result.getViolationTypes());
            String primaryViolation = result.getViolationTypes().isEmpty()
                    ? "Nội dung không phù hợp"
                    : result.getViolationTypes().get(0);

            ReportReason reason = reportReasonRepository.findByName(primaryViolation)
                    .orElseGet(() -> {
                        log.warn("Không tìm thấy lý do báo cáo '{}', sử dụng mặc định", primaryViolation);
                        return reportReasonRepository.findByName("Nội dung không phù hợp")
                                .orElseThrow(() -> new IllegalStateException("Không có lý do mặc định"));
                    });

            moderation.setViolationReason(reason);

            TargetType targetType = targetTypeRepository.findById(1)
                    .orElseThrow(() -> new IllegalStateException("Không tìm thấy loại đối tượng báo cáo với ID = 1"));

            ReportStatus status = reportStatusRepository.findById(1)
                    .orElseThrow(() -> new IllegalStateException("Không tìm thấy trạng thái báo cáo với ID = 1"));

            User systemUser = userRepository.findFirstByIsSystemTrue()
                    .orElseThrow(() -> new IllegalStateException("Không tìm thấy user hệ thống"));

            Report report = Report.builder()
                    .reporter(systemUser)
                    .reporterType(Report.ReporterType.AI)
                    .targetId(postId)
                    .targetType(targetType)
                    .reason(reason)
                    .processingStatus(status)
                    .reportTime(Instant.now())
                    .status(true)
                    .build();
            reportRepository.save(report);

            ReportHistory history = ReportHistory.builder()
                    .report(report)
                    .reporter(systemUser)
                    .reporterType(Report.ReporterType.AI)
                    .processingStatus(status)
                    .actionTime(Instant.now())
                    .status(true)
                    .build();
            reportHistoryRepository.save(history);

            postAIModerationRepository.save(moderation);

            // ✅ Gửi realtime WebSocket cho admin
            sendReportToAdmin(report, systemUser, reason, status);

            // Gửi thông báo hệ thống
            User aiUser = userRepository.findByEmail("ai@system.local")
                    .orElseThrow(() -> new IllegalStateException("AI user not found"));

            List<User> admins = userRepository.findAllByIsAdminTrue(); // giả sử bạn có hàm này

            for (User admin : admins) {
                messagingTemplate.convertAndSend("/topic/admin/toast", Map.of(
                        "type", "AI_FLAGGED_POST",
                        "message", "🚨 AI đã gắn cờ bài viết của " + post.getOwner().getDisplayName()
                ));
            }


            notificationService.sendNotification(
                    post.getOwner().getId(),
                    "AI_FLAGGED_NOTICE",
                    "📣 Bài viết của bạn đã bị AI báo cáo là vi phạm nội dung. Vui lòng chờ xét duyệt.",
                    post.getOwner().getId(),
                    "PROFILE",
                    mediaService.getAvatarUrlByUserId(aiUser.getId())
            );
            log.info("AI đã gắn cờ bài viết #{} vì vi phạm: {}. Viết vào hàng chờ xử lý cho admin.", postId, joinedReasons);
        }

        @Transactional
        public void moderateUncheckedPosts() {
            int batchSize = 3;
            List<Post> uncheckedPosts = postRepository.findUncheckedPosts(Pageable.ofSize(batchSize));

            log.info("🔍 Bắt đầu kiểm duyệt {} bài viết chưa được AI kiểm duyệt", uncheckedPosts.size());

            for (Post post : uncheckedPosts) {
                try {
                    moderatePost(post.getId());
                } catch (Exception e) {
                    log.error("❌ Lỗi khi kiểm duyệt post #{}: {}", post.getId(), e.getMessage(), e);
                }
            }

            log.info("✅ Đã kiểm duyệt xong tất cả bài viết trong lô này.");
        }

        private void sendReportToAdmin(Report report, User reporter, ReportReason reason, ReportStatus status) {
            messagingTemplate.convertAndSend("/topic/admin/reports", Map.of(
                    "id", report.getId(),
                    "targetId", report.getTargetId(),
                    "targetTypeId", report.getTargetType().getId(),
                    "reporterUsername", reporter.getUsername(),
                    "reason", reason.getName(),
                    "createdAt", report.getReportTime().getEpochSecond(),
                    "processingStatusId", status.getId(),
                    "processingStatusName", status.getName()
            ));
        }
    }
