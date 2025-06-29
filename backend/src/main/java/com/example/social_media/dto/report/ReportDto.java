package com.example.social_media.dto.report;

import com.example.social_media.entity.Report;
import com.example.social_media.entity.TargetType;
import com.example.social_media.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportDto {
    private Integer id;
    private UserInfo reporter;
    private Integer targetId;
    private TargetTypeInfo targetType;
    private String reason;
    private Instant reportTime;
    private Boolean status;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        private Integer id;
        private String username;
        private String displayName;
        
        public static UserInfo fromEntity(User user) {
            if (user == null) return null;
            return UserInfo.builder()
                    .id(user.getId())
                    .username(user.getUsername())
                    .displayName(user.getDisplayName())
                    .build();
        }
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TargetTypeInfo {
        private Integer id;
        private String name;
        private String code;
        
        public static TargetTypeInfo fromEntity(TargetType targetType) {
            if (targetType == null) return null;
            return TargetTypeInfo.builder()
                    .id(targetType.getId())
                    .name(targetType.getName())
                    .code(targetType.getCode())
                    .build();
        }
    }
    
    public static ReportDto fromEntity(Report report) {
        if (report == null) return null;
        return ReportDto.builder()
                .id(report.getId())
                .reporter(UserInfo.fromEntity(report.getReporter()))
                .targetId(report.getTargetId())
                .targetType(TargetTypeInfo.fromEntity(report.getTargetType()))
                .reason(report.getReason())
                .reportTime(report.getReportTime())
                .status(report.getStatus())
                .build();
    }
}