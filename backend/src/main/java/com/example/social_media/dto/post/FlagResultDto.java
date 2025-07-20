package com.example.social_media.dto.post;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FlagResultDto {
        private boolean isViolation;
        private List<String> violationTypes;
        private String explanation;

    }
