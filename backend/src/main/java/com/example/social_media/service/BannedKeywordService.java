package com.example.social_media.service;

import com.example.social_media.entity.BannedKeyword;
import com.example.social_media.repository.BannedKeywordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class BannedKeywordService {
    
    private final BannedKeywordRepository bannedKeywordRepository;
    private final ActivityLogService activityLogService;
    
    @Autowired
    public BannedKeywordService(BannedKeywordRepository bannedKeywordRepository, 
                               ActivityLogService activityLogService) {
        this.bannedKeywordRepository = bannedKeywordRepository;
        this.activityLogService = activityLogService;
    }
    
    /**
     * Lấy tất cả từ khóa bị cấm với phân trang
     */
    public Page<BannedKeyword> getAllBannedKeywords(Pageable pageable) {
        return bannedKeywordRepository.findAllWithPagination(pageable);
    }
    
    /**
     * Tìm kiếm từ khóa bị cấm
     */
    public Page<BannedKeyword> searchBannedKeywords(String keyword, Pageable pageable) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return bannedKeywordRepository.findAllWithPagination(pageable);
        }
        return bannedKeywordRepository.findByKeywordContaining(keyword.trim(), pageable);
    }
    
    /**
     * Lấy từ khóa bị cấm theo ID
     */
    public BannedKeyword getBannedKeywordById(Integer id) {
        return bannedKeywordRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Banned keyword not found with id: " + id));
    }
    
    /**
     * Tạo từ khóa bị cấm mới
     */
    public BannedKeyword createBannedKeyword(String keyword, Integer adminUserId) {
        // Kiểm tra từ khóa đã tồn tại chưa
        if (bannedKeywordRepository.existsByKeyword(keyword.trim())) {
            throw new IllegalArgumentException("Keyword already exists: " + keyword);
        }
        
        BannedKeyword bannedKeyword = new BannedKeyword();
        bannedKeyword.setKeyword(keyword.trim().toLowerCase());
        bannedKeyword.setCreatedAt(Instant.now());
        bannedKeyword.setStatus(true);
        
        BannedKeyword savedKeyword = bannedKeywordRepository.save(bannedKeyword);
        
        // Log hoạt động
        activityLogService.logUserActivity(
            adminUserId, 
            "CREATE_BANNED_KEYWORD", 
            "Created banned keyword: " + keyword
        );
        
        return savedKeyword;
    }
    
    /**
     * Cập nhật từ khóa bị cấm
     */
    public BannedKeyword updateBannedKeyword(Integer id, String keyword, Integer adminUserId) {
        BannedKeyword existingKeyword = getBannedKeywordById(id);
        
        // Kiểm tra từ khóa mới đã tồn tại chưa (trừ chính nó)
        if (!existingKeyword.getKeyword().equals(keyword.trim().toLowerCase()) && 
            bannedKeywordRepository.existsByKeyword(keyword.trim())) {
            throw new IllegalArgumentException("Keyword already exists: " + keyword);
        }
        
        String oldKeyword = existingKeyword.getKeyword();
        existingKeyword.setKeyword(keyword.trim().toLowerCase());
        
        BannedKeyword updatedKeyword = bannedKeywordRepository.save(existingKeyword);
        
        // Log hoạt động
        activityLogService.logUserActivity(
            adminUserId, 
            "UPDATE_BANNED_KEYWORD", 
            "Updated banned keyword from '" + oldKeyword + "' to '" + keyword + "'"
        );
        
        return updatedKeyword;
    }
    
    /**
     * Cập nhật trạng thái từ khóa bị cấm
     */
    public BannedKeyword updateBannedKeywordStatus(Integer id, Boolean status, Integer adminUserId) {
        BannedKeyword bannedKeyword = getBannedKeywordById(id);
        bannedKeyword.setStatus(status);
        
        BannedKeyword updatedKeyword = bannedKeywordRepository.save(bannedKeyword);
        
        // Log hoạt động
        String action = status ? "ACTIVATE_BANNED_KEYWORD" : "DEACTIVATE_BANNED_KEYWORD";
        String message = (status ? "Activated" : "Deactivated") + " banned keyword: " + bannedKeyword.getKeyword();
        
        activityLogService.logUserActivity(adminUserId, action, message);
        
        return updatedKeyword;
    }
    
    /**
     * Xóa từ khóa bị cấm
     */
    public void deleteBannedKeyword(Integer id, Integer adminUserId) {
        BannedKeyword bannedKeyword = getBannedKeywordById(id);
        String keyword = bannedKeyword.getKeyword();
        
        bannedKeywordRepository.delete(bannedKeyword);
        
        // Log hoạt động
        activityLogService.logUserActivity(
            adminUserId, 
            "DELETE_BANNED_KEYWORD", 
            "Deleted banned keyword: " + keyword
        );
    }
    
    /**
     * Lấy từ khóa theo trạng thái
     */
    public Page<BannedKeyword> getBannedKeywordsByStatus(Boolean status, Pageable pageable) {
        return bannedKeywordRepository.findByStatus(status, pageable);
    }
    
    /**
     * Lấy tất cả từ khóa đang hoạt động
     */
    public List<BannedKeyword> getAllActiveKeywords() {
        return bannedKeywordRepository.findAllActiveKeywords();
    }
    
    /**
     * Kiểm tra nội dung có chứa từ khóa bị cấm không
     */
    public boolean containsBannedKeyword(String content) {
        if (content == null || content.trim().isEmpty()) {
            return false;
        }
        
        List<BannedKeyword> activeKeywords = getAllActiveKeywords();
        String lowerContent = content.toLowerCase();
        
        return activeKeywords.stream()
                .anyMatch(keyword -> lowerContent.contains(keyword.getKeyword().toLowerCase()));
    }
}