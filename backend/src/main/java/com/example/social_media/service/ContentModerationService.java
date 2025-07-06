package com.example.social_media.service;

import com.example.social_media.entity.BannedKeyword;
import com.example.social_media.entity.ContentPolicy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service tích hợp để kiểm tra nội dung với cả banned keywords và content policies
 * Tương tự như stored procedure sp_CheckContentPolicy trong database
 */
@Service
public class ContentModerationService {
    
    private final BannedKeywordService bannedKeywordService;
    private final ContentPolicyService contentPolicyService;
    private final ActivityLogService activityLogService;
    
    @Autowired
    public ContentModerationService(BannedKeywordService bannedKeywordService,
                                   ContentPolicyService contentPolicyService,
                                   ActivityLogService activityLogService) {
        this.bannedKeywordService = bannedKeywordService;
        this.contentPolicyService = contentPolicyService;
        this.activityLogService = activityLogService;
    }
    
    /**
     * Kiểm tra toàn diện nội dung (tương tự sp_CheckContentPolicy)
     * @param content Nội dung cần kiểm tra
     * @param userId ID người dùng (để log)
     * @return Map chứa kết quả kiểm tra chi tiết
     */
    public Map<String, Object> checkContentPolicy(String content, Integer userId) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Kiểm tra nội dung rỗng
            if (content == null || content.trim().isEmpty()) {
                result.put("isValid", true);
                result.put("violationType", "NONE");
                result.put("message", "Content is empty");
                result.put("bannedKeywords", new ArrayList<>());
                result.put("violatedPolicies", new ArrayList<>());
                return result;
            }
            
            // Kiểm tra banned keywords
            boolean containsBannedKeywords = bannedKeywordService.containsBannedKeywords(content);
            List<String> foundBannedKeywords = bannedKeywordService.findBannedKeywordsInContent(content);
            
            // Kiểm tra content policies
            boolean violatesContentPolicy = contentPolicyService.violatesContentPolicy(content);
            List<ContentPolicy> activePolicies = contentPolicyService.getAllActivePolicies();
            List<String> violatedPolicyNames = new ArrayList<>();
            
            // Tìm các chính sách bị vi phạm
            if (violatesContentPolicy) {
                String lowerContent = content.toLowerCase();
                for (ContentPolicy policy : activePolicies) {
                    if (lowerContent.contains(policy.getPolicyName().toLowerCase())) {
                        violatedPolicyNames.add(policy.getPolicyName());
                    }
                }
            }
            
            // Xác định kết quả tổng thể
            boolean isValid = !containsBannedKeywords && !violatesContentPolicy;
            String violationType = "NONE";
            String message = "Content is valid";
            
            if (containsBannedKeywords && violatesContentPolicy) {
                violationType = "BOTH";
                message = "Content contains banned keywords and violates content policies";
            } else if (containsBannedKeywords) {
                violationType = "BANNED_KEYWORDS";
                message = "Content contains banned keywords";
            } else if (violatesContentPolicy) {
                violationType = "CONTENT_POLICY";
                message = "Content violates content policies";
            }
            
            // Tạo kết quả
            result.put("isValid", isValid);
            result.put("violationType", violationType);
            result.put("message", message);
            result.put("bannedKeywords", foundBannedKeywords);
            result.put("violatedPolicies", violatedPolicyNames);
            result.put("containsBannedKeywords", containsBannedKeywords);
            result.put("violatesContentPolicy", violatesContentPolicy);
            result.put("totalViolations", foundBannedKeywords.size() + violatedPolicyNames.size());
            
            // Log hoạt động nếu có vi phạm
            if (!isValid && userId != null) {
                String logMessage = String.format(
                    "Content moderation check - Type: %s, Banned keywords: %d, Policy violations: %d",
                    violationType,
                    foundBannedKeywords.size(),
                    violatedPolicyNames.size()
                );
                activityLogService.logUserActivity(userId, "CONTENT_MODERATION_CHECK", logMessage);
            }
            
        } catch (Exception e) {
            result.put("isValid", false);
            result.put("violationType", "ERROR");
            result.put("message", "Error checking content: " + e.getMessage());
            result.put("bannedKeywords", new ArrayList<>());
            result.put("violatedPolicies", new ArrayList<>());
            result.put("containsBannedKeywords", false);
            result.put("violatesContentPolicy", false);
            result.put("totalViolations", 0);
        }
        
        return result;
    }
    
    /**
     * Kiểm tra nội dung đơn giản (chỉ trả về true/false)
     * @param content Nội dung cần kiểm tra
     * @return true nếu nội dung hợp lệ, false nếu vi phạm
     */
    public boolean isContentValid(String content) {
        if (content == null || content.trim().isEmpty()) {
            return true;
        }
        
        boolean containsBannedKeywords = bannedKeywordService.containsBannedKeywords(content);
        boolean violatesContentPolicy = contentPolicyService.violatesContentPolicy(content);
        
        return !containsBannedKeywords && !violatesContentPolicy;
    }
    
    /**
     * Lấy thống kê về banned keywords và content policies
     */
    public Map<String, Object> getModerationStatistics() {
        Map<String, Object> stats = new HashMap<>();
        
        try {
            List<BannedKeyword> activeBannedKeywords = bannedKeywordService.getAllActiveKeywords();
            List<ContentPolicy> activePolicies = contentPolicyService.getAllActivePolicies();
            
            stats.put("totalActiveBannedKeywords", activeBannedKeywords.size());
            stats.put("totalActiveContentPolicies", activePolicies.size());
            stats.put("activeBannedKeywords", activeBannedKeywords);
            stats.put("activeContentPolicies", activePolicies);
            
        } catch (Exception e) {
            stats.put("error", "Failed to get moderation statistics: " + e.getMessage());
        }
        
        return stats;
    }
    
    /**
     * Làm sạch nội dung bằng cách thay thế các từ khóa bị cấm
     * @param content Nội dung gốc
     * @param replacement Chuỗi thay thế (mặc định là "***")
     * @return Nội dung đã được làm sạch
     */
    public String sanitizeContent(String content, String replacement) {
        if (content == null || content.trim().isEmpty()) {
            return content;
        }
        
        if (replacement == null) {
            replacement = "***";
        }
        
        String sanitizedContent = content;
        List<BannedKeyword> activeBannedKeywords = bannedKeywordService.getAllActiveKeywords();
        
        for (BannedKeyword bannedKeyword : activeBannedKeywords) {
            String keyword = bannedKeyword.getKeyword();
            // Thay thế không phân biệt hoa thường
            sanitizedContent = sanitizedContent.replaceAll("(?i)" + keyword, replacement);
        }
        
        return sanitizedContent;
    }
    
    /**
     * Làm sạch nội dung với replacement mặc định
     */
    public String sanitizeContent(String content) {
        return sanitizeContent(content, "***");
    }
    
    /**
     * Kiểm tra và làm sạch nội dung trong một lần gọi
     */
    public Map<String, Object> checkAndSanitizeContent(String content, Integer userId, String replacement) {
        Map<String, Object> result = checkContentPolicy(content, userId);
        
        if (!(Boolean) result.get("isValid")) {
            String sanitizedContent = sanitizeContent(content, replacement);
            result.put("sanitizedContent", sanitizedContent);
        } else {
            result.put("sanitizedContent", content);
        }
        
        return result;
    }
}