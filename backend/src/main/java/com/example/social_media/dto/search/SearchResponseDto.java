package com.example.social_media.dto.search;

import com.example.social_media.dto.group.GroupDto;
import com.example.social_media.dto.user.UserDto;

import java.util.List;

public record SearchResponseDto(
        List<UserDto> users,
        List<GroupDto> groups
) {}