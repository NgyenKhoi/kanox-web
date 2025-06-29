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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class CommentService {

    private final EntityManager entityManager;
    private final CommentRepository commentRepository;
    private final PrivacyService privacyService;

    public CommentService(EntityManager entityManager,
                          CommentRepository commentRepository,
                          PrivacyService privacyService) {
        this.entityManager = entityManager;
        this.commentRepository = commentRepository;
        this.privacyService = privacyService;
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

        if (userId == null || postId == null) {
            throw new IllegalArgumentException("userId và postId không được để trống");
        }

        if (content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("Nội dung bình luận không được để trống");
        }

        if (privacySetting == null || !List.of("public", "friends", "only_me", "custom", "default").contains(privacySetting)) {
            throw new IllegalArgumentException("privacySetting không hợp lệ");
        }

        if ("custom".equals(privacySetting) && customListId == null) {
            throw new IllegalArgumentException("customListId không được để trống khi privacySetting là custom");
        }

        StoredProcedureQuery query = entityManager
                .createStoredProcedureQuery("sp_CreateComment")
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

        try {
            query.execute();
            Integer commentId = (Integer) query.getOutputParameterValue("new_comment_id");

            Comment comment = commentRepository.findById(commentId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bình luận vừa tạo"));

            User user = comment.getUser();
            UserBasicDisplayDto userDto = new UserBasicDisplayDto(
                    user.getId(),
                    user.getDisplayName(),
                    user.getUsername(),
                    null
            );

            return new CommentResponseDto(
                    comment.getId(),
                    comment.getContent(),
                    userDto,
                    comment.getCreatedAt(),
                    comment.getUpdatedAt(),
                    "Bình luận được tạo thành công",
                    userId,
                    new ArrayList<>()
            );
        } catch (Exception e) {
            String message = e.getCause() != null ? e.getCause().getMessage() : e.getMessage();
            if (message.contains("Invalid or inactive user_id")) {
                throw new IllegalArgumentException("Người dùng không hợp lệ hoặc không hoạt động");
            } else if (message.contains("User does not have permission")) {
                throw new UnauthorizedException("Không có quyền bình luận bài viết này");
            } else {
                throw new RuntimeException("Lỗi khi tạo bình luận: " + message);
            }
        }
    }

    public List<CommentResponseDto> getCommentsByPostId(@NotNull Integer postId) {
        List<Comment> allComments = commentRepository.findByPostIdAndStatusTrue(postId);

        Map<Integer, List<Comment>> repliesGrouped = allComments.stream()
                .filter(c -> c.getParentComment() != null)
                .collect(Collectors.groupingBy(c -> c.getParentComment().getId()));

        List<Comment> parentComments = allComments.stream()
                .filter(c -> c.getParentComment() == null)
                .toList();

        return parentComments.stream()
                .map(c -> mapToDtoWithReplies(c, repliesGrouped))
                .collect(Collectors.toList());
    }

    @Transactional
    public CommentResponseDto updateComment(Integer commentId, Integer userId, String newContent) {
        if (commentId == null || userId == null || newContent == null || newContent.trim().isEmpty()) {
            throw new IllegalArgumentException("Thiếu thông tin cần thiết để cập nhật bình luận");
        }

        StoredProcedureQuery query = entityManager
                .createStoredProcedureQuery("sp_UpdateComment")
                .registerStoredProcedureParameter("comment_id", Integer.class, ParameterMode.IN)
                .registerStoredProcedureParameter("user_id", Integer.class, ParameterMode.IN)
                .registerStoredProcedureParameter("new_content", String.class, ParameterMode.IN)
                .setParameter("comment_id", commentId)
                .setParameter("user_id", userId)
                .setParameter("new_content", newContent);

        try {
            query.execute();

            Comment comment = commentRepository.findById(commentId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bình luận"));

            User user = comment.getUser();
            UserBasicDisplayDto userDto = new UserBasicDisplayDto(
                    user.getId(),
                    user.getDisplayName(),
                    user.getUsername(),
                    null
            );

            return new CommentResponseDto(
                    comment.getId(),
                    comment.getContent(),
                    userDto,
                    comment.getCreatedAt(),
                    comment.getUpdatedAt(),
                    "Bình luận đã được cập nhật",
                    user.getId(),
                    new ArrayList<>()
            );
        } catch (Exception e) {
            String msg = e.getCause() != null ? e.getCause().getMessage() : e.getMessage();
            if (msg.contains("not authorized")) {
                throw new UnauthorizedException("Bạn không có quyền sửa bình luận này");
            } else {
                throw new RuntimeException("Lỗi cập nhật bình luận: " + msg);
            }
        }
    }

    @Transactional
    public void deleteComment(Integer commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bình luận"));

        comment.setStatus(false);
        commentRepository.save(comment);
    }

    private CommentResponseDto mapToDtoWithReplies(Comment comment, Map<Integer, List<Comment>> repliesGrouped) {
        User user = comment.getUser();
        UserBasicDisplayDto userDto = new UserBasicDisplayDto(
                user.getId(),
                user.getDisplayName(),
                user.getUsername(),
                null
        );

        List<CommentResponseDto> replies = repliesGrouped.getOrDefault(comment.getId(), List.of())
                .stream()
                .map(reply -> mapToDtoWithReplies(reply, repliesGrouped))
                .collect(Collectors.toList());

        return new CommentResponseDto(
                comment.getId(),
                comment.getContent(),
                userDto,
                comment.getCreatedAt(),
                comment.getUpdatedAt(),
                null,
                user.getId(),
                replies
        );
    }
}
