    package com.example.social_media.service.AI;

    import com.example.social_media.dto.media.MediaDto;
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
    import java.util.ArrayList;
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
        private final VisionModerationService visionModerationService;

        private static final double MIN_CONFIDENCE_THRESHOLD = 0.75;

        @Transactional
        public void moderatePost(Integer postId) {
            Optional<Post> optionalPost = postRepository.findById(postId);
            if (optionalPost.isEmpty()) {
                log.warn("Không tìm thấy bài viết với id = {}", postId);
                return;
            }

            Post post = optionalPost.get();

            // Lấy media từ mediaService
            Map<Integer, List<MediaDto>> mediaMap = mediaService.getMediaByTargetIds(
                    List.of(postId), "POST", "image", true
            );
            List<MediaDto> mediaList = mediaMap.getOrDefault(postId, List.of());

            // Gọi kiểm duyệt nội dung
            Optional<FlagResultDto> contentResultOpt = vertexAIService.analyzePost(post.getContent());

            // Gọi kiểm duyệt ảnh đầu tiên (nếu có)
            Optional<FlagResultDto> imageResultOpt = Optional.empty();
            if (!mediaList.isEmpty()) {
                String firstImageUrl = mediaList.getFirst().getUrl();
                imageResultOpt = visionModerationService.analyzeImage(firstImageUrl);
            }

            boolean hasContentViolation = contentResultOpt.map(FlagResultDto::isViolation).orElse(false);
            boolean hasImageViolation = imageResultOpt.map(FlagResultDto::isViolation).orElse(false);

            if (!hasContentViolation && !hasImageViolation) {
                saveModerationRecord(post, false, null);
                log.info("✅ Post #{} không vi phạm", postId);
                return;
            }

            // Gộp lý do vi phạm từ cả 2 nguồn
            List<String> allViolations = new ArrayList<>();
            contentResultOpt.map(FlagResultDto::getViolationTypes).ifPresent(allViolations::addAll);
            imageResultOpt.map(FlagResultDto::getViolationTypes).ifPresent(allViolations::addAll);

            List<String> distinctViolations = allViolations.stream().distinct().toList();

            String primaryViolation = distinctViolations.isEmpty()
                    ? "Nội dung không phù hợp"
                    : distinctViolations.getFirst();

            ReportReason reason = reportReasonRepository.findByName(primaryViolation)
                    .orElseGet(() -> reportReasonRepository.findByName("Nội dung không phù hợp")
                            .orElseThrow(() -> new IllegalStateException("Không có lý do mặc định")));

            saveModerationRecord(post, true, reason);
            createAIReport(post, reason, distinctViolations, contentResultOpt, imageResultOpt);

            log.info("🚨 AI gắn cờ post #{} với lý do: {}", postId, String.join(", ", distinctViolations));
        }


        private void saveModerationRecord(Post post, boolean flagged, ReportReason reason) {
            PostAIModeration moderation = new PostAIModeration();
            moderation.setPost(post);
            moderation.setChecked(true);
            moderation.setCheckedAt(Instant.now());
            moderation.setFlagged(flagged);
            moderation.setViolationReason(reason);
            postAIModerationRepository.save(moderation);
        }

        private void createAIReport(Post post, ReportReason reason, List<String> violations,
                                    Optional<FlagResultDto> contentResultOpt,
                                    Optional<FlagResultDto> imageResultOpt) {
            TargetType targetType = targetTypeRepository.findById(1)
                    .orElseThrow(() -> new IllegalStateException("Không tìm thấy loại đối tượng báo cáo"));

            ReportStatus status = reportStatusRepository.findById(1)
                    .orElseThrow(() -> new IllegalStateException("Không tìm thấy trạng thái báo cáo"));

            User systemUser = userRepository.findFirstByIsSystemTrue()
                    .orElseThrow(() -> new IllegalStateException("Không tìm thấy user hệ thống"));

            Report report = Report.builder()
                    .reporter(systemUser)
                    .reporterType(Report.ReporterType.AI)
                    .targetId(post.getId())
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

            sendReportToAdmin(report, systemUser, reason, status);

            User aiUser = userRepository.findByEmail("ai@system.local")
                    .orElseThrow(() -> new IllegalStateException("AI user not found"));

            String message = buildViolationMessage(contentResultOpt, imageResultOpt);
            if (!message.isBlank()) {
                notificationService.sendNotification(
                        post.getOwner().getId(),
                        "AI_FLAGGED_NOTICE",
                        message,
                        systemUser.getId(),
                        "PROFILE",
                        mediaService.getAvatarUrlByUserId(aiUser.getId())
                );
            }

            for (User admin : userRepository.findAllByIsAdminTrue()) {
                messagingTemplate.convertAndSend("/topic/admin/toast", Map.of(
                        "type", "AI_FLAGGED_POST",
                        "message", "🚨 AI đã gắn cờ bài viết của " + post.getOwner().getDisplayName()
                ));
            }
        }

        private String buildViolationMessage(Optional<FlagResultDto> contentOpt, Optional<FlagResultDto> imageOpt) {
            StringBuilder explanation = new StringBuilder("📣 Bài viết của bạn đã bị AI gắn cờ:\n");

            contentOpt.ifPresent(content -> {
                if (content.isViolation()) {
                    explanation.append("- **Nội dung** vi phạm: ")
                            .append(String.join(", ", content.getViolationTypes()))
                            .append("\n");
                }
            });

            imageOpt.ifPresent(image -> {
                if (image.isViolation()) {
                    explanation.append("- **Hình ảnh** vi phạm: ")
                            .append(String.join(", ", image.getViolationTypes()))
                            .append("\n");
                }
            });

            return explanation.toString().trim();
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
