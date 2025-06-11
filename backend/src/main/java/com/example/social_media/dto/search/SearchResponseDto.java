package com.example.social_media.dto.search;

import com.example.social_media.document.GroupDocument;
import com.example.social_media.document.PageDocument;
import com.example.social_media.document.UserDocument;

import java.util.List;

public record SearchResponseDto(
        List<UserDocument> users,
        List<GroupDocument> groups,
        List<PageDocument> pages
) {}