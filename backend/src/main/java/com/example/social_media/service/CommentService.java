package com.example.social_media.service;

import com.example.social_media.dto.comment.CommentResponseDto;
import com.example.social_media.dto.media.MediaDto;
import com.example.social_media.dto.notification.NotificationDto;
import com.example.social_media.dto.user.UserBasicDisplayDto;
import com.example.social_media.entity.Comment;
import com.example.social_media.entity.Group;
import com.example.social_media.entity.Post;
import com.example.social_media.entity.User;
import com.example.social_media.exception.NotFoundException;
import com.example.social_media.exception.UnauthorizedException;
import com.example.social_media.repository.CommentRepository;
import com.example.social_media.repository.post.PostRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.ParameterMode;
import jakarta.persistence.StoredProcedureQuery;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class CommentService {

    private final EntityManager entityManager;
    private final CommentRepository commentRepository;
    private final PrivacyService privacyService;
    private final RedisTemplate<String, List<CommentResponseDto>> redisCommentTemplate;
    private final MediaService mediaService;
    private final NotificationService notificationService;
    private final PostRepository postRepository;

    public CommentService(EntityManager entityManager,
                          CommentRepository commentRepository,
                          PrivacyService privacyService,
                          RedisTemplate<String, List<CommentResponseDto>> redisCommentTemplate,
                          MediaService mediaService,
                          NotificationService notificationService,
                          PostRepository postRepository) { // Thêm vào constructor
        this.entityManager = entityManager;
        this.commentRepository = commentRepository;
        this.privacyService = privacyService;
        this.redisCommentTemplate = redisCommentTemplate;
        this.mediaService = mediaService;
        this.notificationService = notificationService;
        this.postRepository = postRepository;
    }

    @Transactional
    public CommentResponseDto createComment(@NotNull Integer userId,
                                            @NotNull Integer postId,
                                            @NotNull String content,
                                            String privacySetting,
                                            Integer parentCommentId,
                                            Integer customListId,
                                            List<MultipartFile> mediaFiles) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new NotFoundException("Post not found"));

        Integer ownerId = privacyService.getContentOwnerId(postId);

        if (!userId.equals(ownerId)) {
            boolean isGroupPost = post.getGroup() != null;

            if (isGroupPost) {
                Group group = post.getGroup();

                if (!"public".equalsIgnoreCase(group.getPrivacyLevel())) {
                    if (!privacyService.checkContentAccess(userId, postId, "POST")) {
                        throw new UnauthorizedException("Bạn không có quyền bình luận bài viết này");
                    }
                }
            } else {
                // Bài viết cá nhân - vẫn check quyền
                if (!privacyService.checkContentAccess(userId, postId, "POST")) {
                    throw new UnauthorizedException("Bạn không có quyền bình luận bài viết này");
                }
            }
        }

        if (postId == null || (content == null || content.trim().isEmpty()) && (mediaFiles == null || mediaFiles.isEmpty())) {
            throw new IllegalArgumentException("Thiếu nội dung hoặc media để tạo bình luận");
        }

        if (privacySetting == null || !List.of("public", "friends", "only_me", "custom", "default").contains(privacySetting)) {
            throw new IllegalArgumentException("privacySetting không hợp lệ");
        }

        if ("custom".equals(privacySetting) && customListId == null) {
            throw new IllegalArgumentException("customListId không được để trống khi privacySetting là custom");
        }

        Comment parent = null;
        if (parentCommentId != null && parentCommentId != 0) {
            parent = commentRepository.findById(parentCommentId)
                    .orElseThrow(() -> new NotFoundException("Parent comment không tồn tại"));

            // Đảm bảo parent comment thuộc cùng post
            if (!parent.getPost().getId().equals(postId)) {
                throw new IllegalArgumentException("Parent comment không thuộc bài viết này");
            }
        }

        StoredProcedureQuery query = entityManager.createStoredProcedureQuery("sp_CreateComment")
                .registerStoredProcedureParameter("user_id", Integer.class, ParameterMode.IN)
                .registerStoredProcedureParameter("post_id", Integer.class, ParameterMode.IN)
                .registerStoredProcedureParameter("parent_comment_id", Integer.class, ParameterMode.IN)
                .registerStoredProcedureParameter("content", String.class, ParameterMode.IN)
                .registerStoredProcedureParameter("privacy_setting", String.class, ParameterMode.IN)
                .registerStoredProcedureParameter("custom_list_id", Integer.class, ParameterMode.IN)
                .registerStoredProcedureParameter("new_comment_id", Integer.class, ParameterMode.OUT)
                .setParameter("user_id", userId)
                .setParameter("post_id", postId)
                .setParameter("parent_comment_id", parent != null ? parent.getId() : null)
                .setParameter("content", content)
                .setParameter("privacy_setting", privacySetting)
                .setParameter("custom_list_id", customListId);

        query.execute();
        Integer commentId = (Integer) query.getOutputParameterValue("new_comment_id");

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bình luận vừa tạo"));

        // Lưu media nếu có
        List<MediaDto> mediaDtos = new ArrayList<>();
        if (mediaFiles != null && !mediaFiles.isEmpty()) {
            try {
                mediaDtos = mediaService.uploadMediaFiles(
                        userId,
                        commentId,
                        mediaFiles,
                        content,
                        "COMMENT"
                );
            } catch (Exception e) {
                throw new RuntimeException("Không thể tải lên media: " + e.getMessage(), e);
            }
        }

        // Xóa cache Redis
        redisCommentTemplate.delete("comments:post:" + postId);

        // Gửi thông báo realtime nếu là bình luận cha
        if (parentCommentId == null && !userId.equals(ownerId)) { // Chỉ gửi nếu là bình luận cha và không phải của chính chủ bài viết
            User commenter = comment.getUser();
            String displayName = commenter.getDisplayName() != null ? commenter.getDisplayName() : commenter.getUsername();
            String message = "{displayName} đã bình luận bài viết của bạn";
            String avatarUrl = mediaService.getAvatarUrlByUserId(userId);
            NotificationDto notificationDto = notificationService.sendNotification(
                    ownerId,
                    "POST_COMMENT",
                    message,
                    postId,
                    "POST",
                    null
            );
            notificationDto.setSenderDisplayName(displayName);
            notificationDto.setSenderAvatar(avatarUrl);
        }

        User user = comment.getUser();
        UserBasicDisplayDto userDto = new UserBasicDisplayDto(
                user.getId(), user.getDisplayName(), user.getUsername(), null
        );

        return new CommentResponseDto(comment.getId(), comment.getContent(), userDto,
                comment.getCreatedAt(), comment.getUpdatedAt(), "Bình luận được tạo thành công", userId, new ArrayList<>(), mediaDtos);
    }

    @Transactional
    public CommentResponseDto updateComment(Integer commentId, Integer userId, String newContent) {
        if (commentId == null || userId == null || newContent == null || newContent.trim().isEmpty()) {
            throw new IllegalArgumentException("Thiếu thông tin để cập nhật bình luận");
        }

        StoredProcedureQuery query = entityManager.createStoredProcedureQuery("sp_UpdateComment")
                .registerStoredProcedureParameter("comment_id", Integer.class, ParameterMode.IN)
                .registerStoredProcedureParameter("user_id", Integer.class, ParameterMode.IN)
                .registerStoredProcedureParameter("new_content", String.class, ParameterMode.IN)
                .setParameter("comment_id", commentId)
                .setParameter("user_id", userId)
                .setParameter("new_content", newContent);

        query.execute();

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bình luận"));

        redisCommentTemplate.delete("comments:post:" + comment.getPost().getId());

        User user = comment.getUser();
        UserBasicDisplayDto userDto = new UserBasicDisplayDto(
                user.getId(), user.getDisplayName(), user.getUsername(), null
        );

        List<MediaDto> mediaDtos = mediaService.getMediaByTargetDto(commentId, "COMMENT", "image", true);
        mediaDtos.addAll(mediaService.getMediaByTargetDto(commentId, "COMMENT", "video", true));
        mediaDtos.addAll(mediaService.getMediaByTargetDto(commentId, "COMMENT", "audio", true));

        return new CommentResponseDto(
                comment.getId(),
                comment.getContent(),
                userDto,
                comment.getCreatedAt(),
                comment.getUpdatedAt(),
                "Đã cập nhật bình luận",
                user.getId(),
                new ArrayList<>(),
                mediaDtos
        );
    }

    @Transactional
    public void deleteComment(Integer commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bình luận"));
        comment.setStatus(false);
        commentRepository.save(comment);

        redisCommentTemplate.delete("comments:post:" + comment.getPost().getId());
    }

    public List<CommentResponseDto> getCommentsByPostId(@NotNull Integer postId) {
        String cacheKey = "comments:post:" + postId;
        List<CommentResponseDto> cached = redisCommentTemplate.opsForValue().get(cacheKey);
        if (cached != null) return cached;

        List<Comment> allComments = commentRepository.findByPostIdAndStatusTrue(postId);
        Map<Integer, List<Comment>> repliesGrouped = allComments.stream()
                .filter(c -> c.getParentComment() != null)
                .collect(Collectors.groupingBy(c -> c.getParentComment().getId()));

        List<Integer> commentIds = allComments.stream()
                .map(Comment::getId)
                .collect(Collectors.toList());

        // Lấy media cho tất cả bình luận
        Map<Integer, List<MediaDto>> mediaMap = new HashMap<>();
        if (!commentIds.isEmpty()) {
            mediaMap.putAll(mediaService.getMediaByTargetIds(commentIds, "COMMENT", "image", true));
            mediaMap.putAll(mediaService.getMediaByTargetIds(commentIds, "COMMENT", "video", true));
        }

        List<Comment> parentComments = allComments.stream()
                .filter(c -> c.getParentComment() == null)
                .toList();

        List<CommentResponseDto> result = parentComments.stream()
                .map(c -> mapToDtoWithReplies(c, repliesGrouped, mediaMap))
                .collect(Collectors.toList());

        redisCommentTemplate.opsForValue().set(cacheKey, result, java.time.Duration.ofMinutes(10));
        return result;
    }

    private CommentResponseDto mapToDtoWithReplies(Comment comment, Map<Integer, List<Comment>> repliesGrouped, Map<Integer, List<MediaDto>> mediaMap) {
        User user = comment.getUser();
        UserBasicDisplayDto userDto = new UserBasicDisplayDto(
                user.getId(), user.getDisplayName(), user.getUsername(), null
        );

        List<CommentResponseDto> replies = repliesGrouped.getOrDefault(comment.getId(), List.of()).stream()
                .map(reply -> mapToDtoWithReplies(reply, repliesGrouped, mediaMap))
                .collect(Collectors.toList());

        List<MediaDto> mediaDtos = mediaMap.getOrDefault(comment.getId(), new ArrayList<>());

        return new CommentResponseDto(
                comment.getId(),
                comment.getContent(),
                userDto,
                comment.getCreatedAt(),
                comment.getUpdatedAt(),
                null,
                user.getId(),
                replies,
                mediaDtos
        );
    }
}