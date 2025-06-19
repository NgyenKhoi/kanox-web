package com.example.social_media.service;

import com.example.social_media.entity.Comment;
import jakarta.persistence.EntityManager;
import jakarta.persistence.ParameterMode;
import jakarta.persistence.StoredProcedureQuery;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CommentService {
    
    private final EntityManager entityManager;

    public CommentService(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Transactional
    public Integer createComment(Integer userId, Integer postId, String content, 
            String privacySetting, Integer parentCommentId, Integer customListId) {
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
            return (Integer) query.getOutputParameterValue("new_comment_id");
        } catch (Exception e) {
            throw new RuntimeException("Failed to create comment: " + e.getMessage());
        }
    }
}