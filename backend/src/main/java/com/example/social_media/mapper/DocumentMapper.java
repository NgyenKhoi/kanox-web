package com.example.social_media.mapper;
import com.example.social_media.document.*;
import com.example.social_media.dto.group.GroupDto;
import com.example.social_media.dto.user.UserDto;
import com.example.social_media.entity.Group;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Component
public class DocumentMapper {

    public UserDocument toUserDocument(com.example.social_media.entity.User user) {
        return new UserDocument(
                user.getId(),
                user.getUsername(),
                user.getDisplayName(),
                user.getBio(),
                user.getGender()
        );
    }


    public GroupDocument toGroupDocument(Group group, List<String> memberNames) {
        return new GroupDocument(
                String.valueOf(group.getId()),
                group.getOwner().getId(),
                group.getName(),
                group.getDescription(),
                memberNames
        );
    }

    public UserDto toUserDto(UserDocument doc) {
        return new UserDto(doc.getId(), doc.getUsername(), doc.getDisplayName(), doc.getGender(), doc.getBio());
    }

    public GroupDto toGroupDto(GroupDocument doc) {
        return new GroupDto(doc.getId(), doc.getName(), doc.getDescription());
    }

    private LocalDateTime convertInstantToLocalDateTime(Instant instant) {
        return instant == null ? null : instant.atZone(ZoneId.systemDefault()).toLocalDateTime();
    }
}
