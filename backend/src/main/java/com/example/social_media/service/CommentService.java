package com.example.social_media.service;

import com.example.social_media.dto.comment.CommentResponseDto;
import com.example.social_media.dto.user.UserBasicDisplayDto;
import com.example.social_media.entity.Comment;
import com.example.social_media.entity.User;
import com.example.social_media.exception.UnauthorizedException;
import com.example.social_media.repository.CommentRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.ParameterMode;
import jakarta.persistence.StoredProcedureQuery;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class CommentService {

    private final EntityManager entityManager;
    private final CommentRepository commentRepository;
    private final PrivacyService privacyService;
    private final RedisTemplate<String, List<CommentResponseDto>> redisCommentTemplate;

    public CommentService(EntityManager entityManager,
                          CommentRepository commentRepository,
                          PrivacyService privacyService,
                          RedisTemplate<String, List<CommentResponseDto>> redisCommentTemplate) {
        this.entityManager = entityManager;
        this.commentRepository = commentRepository;
        this.privacyService = privacyService;
        this.redisCommentTemplate = redisCommentTemplate;
    }

    @Transactional
    public CommentResponseDto createComment(@NotNull Integer userId,
                                            @NotNull Integer postId,
                                            @NotNull String content,
                                            String privacySetting,
                                            Integer parentCommentId,
                                            Integer customListId) {
        Integer ownerId = privacyService.getContentOwnerId(postId);
        if (!userId.equals(ownerId)) {
            if (!privacyService.checkContentAccess(userId, postId, "POST")) {
                throw new UnauthorizedException("Bạn không có quyền bình luận bài viết này");
            }
        }

        if (postId == null || content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("Thiếu thông tin cần thiết để tạo bình luận");
        }

        if (privacySetting == null || !List.of("public", "friends", "only_me", "custom", "default").contains(privacySetting)) {
            throw new IllegalArgumentException("privacySetting không hợp lệ");
        }

        if ("custom".equals(privacySetting) && customListId == null) {
            throw new IllegalArgumentException("customListId không được để trống khi privacySetting là custom");
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
                .setParameter("parent_comment_id", parentCommentId)
                .setParameter("content", content)
                .setParameter("privacy_setting", privacySetting)
                .setParameter("custom_list_id", customListId);

        query.execute();
        Integer commentId = (Integer) query.getOutputParameterValue("new_comment_id");

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bình luận vừa tạo"));

        redisCommentTemplate.delete("comments:post:" + postId);

        User user = comment.getUser();
        UserBasicDisplayDto userDto = new UserBasicDisplayDto(
                user.getId(), user.getDisplayName(), user.getUsername(), null
        );

        return new CommentResponseDto(comment.getId(), comment.getContent(), userDto,
                comment.getCreatedAt(), comment.getUpdatedAt(), "Bình luận được tạo thành công", userId, new ArrayList<>());
    }

    public List<CommentResponseDto> getCommentsByPostId(@NotNull Integer postId) {
        String cacheKey = "comments:post:" + postId;
        List<CommentResponseDto> cached = redisCommentTemplate.opsForValue().get(cacheKey);
        if (cached != null) return cached;

        List<Comment> allComments = commentRepository.findByPostIdAndStatusTrue(postId);
        Map<Integer, List<Comment>> repliesGrouped = allComments.stream()
                .filter(c -> c.getParentComment() != null)
                .collect(Collectors.groupingBy(c -> c.getParentComment().getId()));

        List<Comment> parentComments = allComments.stream()
                .filter(c -> c.getParentComment() == null)
                .toList();

        List<CommentResponseDto> result = parentComments.stream()
                .map(c -> mapToDtoWithReplies(c, repliesGrouped))
                .collect(Collectors.toList());

        redisCommentTemplate.opsForValue().set(cacheKey, result, java.time.Duration.ofMinutes(10));
        return result;
    }

    @Transactional
    public CommentResponseDto updateComment(Integer commentId, Integer userId, String newContent) {
        if (commentId == null || userId == null || newContent == null || newContent.trim().isEmpty()) {
            throw new IllegalArgumentException("Thiếu thông tin để cập nhật bình luận");
        }

        entityManager.createStoredProcedureQuery("sp_UpdateComment")
                .setParameter("comment_id", commentId)
                .setParameter("user_id", userId)
                .setParameter("new_content", newContent)
                .execute();

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bình luận"));

        redisCommentTemplate.delete("comments:post:" + comment.getPost().getId());

        User user = comment.getUser();
        UserBasicDisplayDto userDto = new UserBasicDisplayDto(user.getId(), user.getDisplayName(), user.getUsername(), null);

        return new CommentResponseDto(comment.getId(), comment.getContent(), userDto,
                comment.getCreatedAt(), comment.getUpdatedAt(), "Đã cập nhật bình luận", user.getId(), new ArrayList<>());
    }

    @Transactional
    public void deleteComment(Integer commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bình luận"));
        comment.setStatus(false);
        commentRepository.save(comment);

        redisCommentTemplate.delete("comments:post:" + comment.getPost().getId());
    }

    private CommentResponseDto mapToDtoWithReplies(Comment comment, Map<Integer, List<Comment>> repliesGrouped) {
        User user = comment.getUser();
        UserBasicDisplayDto userDto = new UserBasicDisplayDto(
                user.getId(), user.getDisplayName(), user.getUsername(), null
        );

        List<CommentResponseDto> replies = repliesGrouped.getOrDefault(comment.getId(), List.of()).stream()
                .map(reply -> mapToDtoWithReplies(reply, repliesGrouped))
                .collect(Collectors.toList());

        return new CommentResponseDto(
                comment.getId(), comment.getContent(), userDto,
                comment.getCreatedAt(), comment.getUpdatedAt(),
                null, user.getId(), replies
        );
    }
}
