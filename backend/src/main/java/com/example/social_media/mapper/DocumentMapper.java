package com.example.social_media.mapper;
import com.example.social_media.document.*;
import com.example.social_media.entity.Media;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Component
public class DocumentMapper {

    public UserDocument toUserDocument(com.example.social_media.entity.User user) {
        return new UserDocument(
                String.valueOf(user.getId()),
                user.getEmail(),
                user.getUsername(),
                user.getDisplayName(),
                user.getPhoneNumber(),
                user.getBio(),
                user.getGender()
        );
    }

    public PostDocument toPostDocument(com.example.social_media.entity.Post post) {
        return new PostDocument(
                String.valueOf(post.getId()),
                post.getOwner().getId(),
                post.getContent(),
                convertInstantToLocalDateTime(post.getCreatedAt()),
                post.getPrivacySetting()
        );
    }

    public GroupDocument toGroupDocument(com.example.social_media.entity.Group group) {
        return new GroupDocument(
                String.valueOf(group.getId()),
                group.getOwner().getId(),
                group.getName(),
                group.getDescription(),
                convertInstantToLocalDateTime(group.getCreatedAt())
        );
    }

    public PageDocument toPageDocument(com.example.social_media.entity.Page page) {
        return new PageDocument(
                String.valueOf(page.getId()),
                page.getOwner().getId(),
                page.getName(),
                page.getDescription(),
                convertInstantToLocalDateTime(page.getCreatedAt())
        );
    }

    public MediaDocument toMediaDocument(Media media) {
        return new MediaDocument(
                String.valueOf(media.getId()),
                media.getMediaUrl(),
                media.getCaption(),
                media.getMediaType().getId(),
                media.getTargetType().getId(),
                media.getTargetId(),
                media.getOwner().getId(), // đảm bảo `media.getOwner()` không null
                convertInstantToLocalDateTime(media.getCreatedAt())
        );
    }

    private LocalDateTime convertInstantToLocalDateTime(Instant instant) {
        return instant == null ? null : instant.atZone(ZoneId.systemDefault()).toLocalDateTime();
    }
}
