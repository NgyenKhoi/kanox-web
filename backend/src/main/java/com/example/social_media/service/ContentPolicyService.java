package com.example.social_media.service;

import com.example.social_media.entity.ContentPolicy;
import com.example.social_media.repository.ContentPolicyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ContentPolicyService {
    
    private final ContentPolicyRepository contentPolicyRepository;
    private final ActivityLogService activityLogService;
    
    @Autowired
    public ContentPolicyService(ContentPolicyRepository contentPolicyRepository,
                               ActivityLogService activityLogService) {
        this.contentPolicyRepository = contentPolicyRepository;
        this.activityLogService = activityLogService;
    }
    
    /**
     * Lấy tất cả chính sách nội dung với phân trang
     */
    public Page<ContentPolicy> getAllContentPolicies(Pageable pageable) {
        return contentPolicyRepository.findAllWithPagination(pageable);
    }
    
    /**
     * Tìm kiếm chính sách nội dung theo tên
     */
    public Page<ContentPolicy> searchContentPolicies(String searchTerm, Pageable pageable) {
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return contentPolicyRepository.findAllWithPagination(pageable);
        }
        return contentPolicyRepository.findByPolicyNameContaining(searchTerm.trim(), pageable);
    }
    
    /**
     * Tìm kiếm chính sách theo mô tả
     */
    public Page<ContentPolicy> searchContentPoliciesByDescription(String description, Pageable pageable) {
        if (description == null || description.trim().isEmpty()) {
            return contentPolicyRepository.findAllWithPagination(pageable);
        }
        return contentPolicyRepository.findByDescriptionContaining(description.trim(), pageable);
    }
    
    /**
     * Lấy chính sách nội dung theo ID
     */
    public ContentPolicy getContentPolicyById(Integer id) {
        return contentPolicyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Content policy not found with id: " + id));
    }
    
    /**
     * Tạo chính sách nội dung mới
     */
    public ContentPolicy createContentPolicy(String policyName, String description, Integer adminUserId) {
        // Kiểm tra tên chính sách đã tồn tại chưa
        if (contentPolicyRepository.existsByPolicyName(policyName.trim())) {
            throw new IllegalArgumentException("Policy name already exists: " + policyName);
        }
        
        ContentPolicy contentPolicy = new ContentPolicy();
        contentPolicy.setPolicyName(policyName.trim());
        contentPolicy.setDescription(description != null ? description.trim() : null);
        contentPolicy.setStatus(true);
        
        ContentPolicy savedPolicy = contentPolicyRepository.save(contentPolicy);
        
        // Log hoạt động
        activityLogService.logUserActivity(
            adminUserId, 
            "CREATE_CONTENT_POLICY", 
            "Created content policy: " + policyName
        );
        
        return savedPolicy;
    }
    
    /**
     * Cập nhật chính sách nội dung
     */
    public ContentPolicy updateContentPolicy(Integer id, String policyName, String description, Integer adminUserId) {
        ContentPolicy existingPolicy = getContentPolicyById(id);
        
        // Kiểm tra tên chính sách mới đã tồn tại chưa (trừ chính nó)
        if (!existingPolicy.getPolicyName().equals(policyName.trim()) && 
            contentPolicyRepository.existsByPolicyName(policyName.trim())) {
            throw new IllegalArgumentException("Policy name already exists: " + policyName);
        }
        
        String oldPolicyName = existingPolicy.getPolicyName();
        existingPolicy.setPolicyName(policyName.trim());
        existingPolicy.setDescription(description != null ? description.trim() : null);
        
        ContentPolicy updatedPolicy = contentPolicyRepository.save(existingPolicy);
        
        // Log hoạt động
        activityLogService.logUserActivity(
            adminUserId, 
            "UPDATE_CONTENT_POLICY", 
            "Updated content policy from '" + oldPolicyName + "' to '" + policyName + "'"
        );
        
        return updatedPolicy;
    }
    
    /**
     * Cập nhật trạng thái chính sách nội dung
     */
    public ContentPolicy updateContentPolicyStatus(Integer id, Boolean status, Integer adminUserId) {
        ContentPolicy contentPolicy = getContentPolicyById(id);
        contentPolicy.setStatus(status);
        
        ContentPolicy updatedPolicy = contentPolicyRepository.save(contentPolicy);
        
        // Log hoạt động
        String action = status ? "ACTIVATE_CONTENT_POLICY" : "DEACTIVATE_CONTENT_POLICY";
        String message = (status ? "Activated" : "Deactivated") + " content policy: " + contentPolicy.getPolicyName();
        
        activityLogService.logUserActivity(adminUserId, action, message);
        
        return updatedPolicy;
    }
    
    /**
     * Xóa chính sách nội dung
     */
    public void deleteContentPolicy(Integer id, Integer adminUserId) {
        ContentPolicy contentPolicy = getContentPolicyById(id);
        String policyName = contentPolicy.getPolicyName();
        
        contentPolicyRepository.delete(contentPolicy);
        
        // Log hoạt động
        activityLogService.logUserActivity(
            adminUserId, 
            "DELETE_CONTENT_POLICY", 
            "Deleted content policy: " + policyName
        );
    }
    
    /**
     * Lấy chính sách theo trạng thái
     */
    public Page<ContentPolicy> getContentPoliciesByStatus(Boolean status, Pageable pageable) {
        return contentPolicyRepository.findByStatus(status, pageable);
    }
    
    /**
     * Lấy tất cả chính sách đang hoạt động
     */
    public List<ContentPolicy> getAllActivePolicies() {
        return contentPolicyRepository.findAllActivePolicies();
    }
    
    /**
     * Kiểm tra nội dung có vi phạm chính sách không
     */
    public boolean violatesContentPolicy(String content) {
        if (content == null || content.trim().isEmpty()) {
            return false;
        }
        
        List<ContentPolicy> activePolicies = getAllActivePolicies();
        String lowerContent = content.toLowerCase();
        
        return activePolicies.stream()
                .anyMatch(policy -> lowerContent.contains(policy.getPolicyName().toLowerCase()));
    }
    
    /**
     * Kiểm tra nội dung có hợp lệ không (kết hợp cả banned keywords và content policies)
     */
    public boolean isContentValid(String content) {
        return !violatesContentPolicy(content);
    }
}