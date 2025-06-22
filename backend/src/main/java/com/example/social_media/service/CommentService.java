package com.example.social_media.service;

import com.example.social_media.dto.comment.CommentResponseDto;
import com.example.social_media.entity.Comment;
import com.example.social_media.entity.User;
import com.example.social_media.exception.UnauthorizedException;
import com.example.social_media.repository.CommentRepository;
import com.example.social_media.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.ParameterMode;
import jakarta.persistence.StoredProcedureQuery;
import jakarta.validation.constraints.NotNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CommentService {
    
    private final EntityManager entityManager;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;

    public CommentService(EntityManager entityManager, CommentRepository commentRepository, 
                         UserRepository userRepository) {
        this.entityManager = entityManager;
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public CommentResponseDto createComment(@NotNull Integer userId, @NotNull Integer postId, 
            @NotNull String content, String privacySetting, Integer parentCommentId, Integer customListId) {
        if (userId == null || postId == null) {
            throw new IllegalArgumentException("userId và postId không được để trống");
        }
        if (content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("Nội dung bình luận không được để trống");
        }
        if (privacySetting == null || !List.of("public", "friends", "only_me", "custom", "default")
                .contains(privacySetting)) {
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
            
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));
            
            return new CommentResponseDto(commentId, content, user.getDisplayName(), 
                    LocalDateTime.now(), "Bình luận được tạo thành công");
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
        List<Comment> comments = commentRepository.findByPostIdAndStatusTrue(postId);
        return comments.stream()
                .map(comment -> new CommentResponseDto(
                        comment.getId(),
                        comment.getContent(),
                        comment.getUser().getDisplayName(),
                        LocalDateTime.ofInstant(comment.getCreatedAt(), ZoneId.of("Asia/Ho_Chi_Minh")), // Chuyển đổi Instant sang LocalDateTime
                        null
                ))
                .collect(Collectors.toList());
    }
}