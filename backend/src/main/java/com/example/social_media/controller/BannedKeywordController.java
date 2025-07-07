package com.example.social_media.controller;

import com.example.social_media.entity.BannedKeyword;
import com.example.social_media.service.BannedKeywordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/banned-keywords")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class BannedKeywordController {
    
    private final BannedKeywordService bannedKeywordService;
    
    @Autowired
    public BannedKeywordController(BannedKeywordService bannedKeywordService) {
        this.bannedKeywordService = bannedKeywordService;
    }
    
    /**
     * Lấy tất cả từ khóa bị cấm với phân trang
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllBannedKeywords(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        try {
            Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                       Sort.by(sortBy).descending() : 
                       Sort.by(sortBy).ascending();
            
            Pageable pageable = PageRequest.of(page, size, sort);
            Page<BannedKeyword> bannedKeywords = bannedKeywordService.getAllBannedKeywords(pageable);
            
            Map<String, Object> response = new HashMap<>();
            response.put("bannedKeywords", bannedKeywords.getContent());
            response.put("currentPage", bannedKeywords.getNumber());
            response.put("totalItems", bannedKeywords.getTotalElements());
            response.put("totalPages", bannedKeywords.getTotalPages());
            response.put("hasNext", bannedKeywords.hasNext());
            response.put("hasPrevious", bannedKeywords.hasPrevious());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to retrieve banned keywords");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Tìm kiếm từ khóa bị cấm
     */
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchBannedKeywords(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        try {
            Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                       Sort.by(sortBy).descending() : 
                       Sort.by(sortBy).ascending();
            
            Pageable pageable = PageRequest.of(page, size, sort);
            Page<BannedKeyword> bannedKeywords = bannedKeywordService.searchBannedKeywords(keyword, pageable);
            
            Map<String, Object> response = new HashMap<>();
            response.put("bannedKeywords", bannedKeywords.getContent());
            response.put("currentPage", bannedKeywords.getNumber());
            response.put("totalItems", bannedKeywords.getTotalElements());
            response.put("totalPages", bannedKeywords.getTotalPages());
            response.put("hasNext", bannedKeywords.hasNext());
            response.put("hasPrevious", bannedKeywords.hasPrevious());
            response.put("searchKeyword", keyword);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to search banned keywords");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Lấy từ khóa bị cấm theo ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getBannedKeywordById(@PathVariable Integer id) {
        try {
            BannedKeyword bannedKeyword = bannedKeywordService.getBannedKeywordById(id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("bannedKeyword", bannedKeyword);
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Banned keyword not found");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to retrieve banned keyword");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Tạo từ khóa bị cấm mới
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createBannedKeyword(@RequestBody Map<String, String> request) {
        try {
            String keyword = request.get("keyword");
            
            if (keyword == null || keyword.trim().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Keyword is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }
            
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            Integer adminUserId = Integer.parseInt(auth.getName());
            
            BannedKeyword bannedKeyword = bannedKeywordService.createBannedKeyword(keyword, adminUserId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Banned keyword created successfully");
            response.put("bannedKeyword", bannedKeyword);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Invalid input");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to create banned keyword");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Cập nhật từ khóa bị cấm
     */
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateBannedKeyword(
            @PathVariable Integer id, 
            @RequestBody Map<String, String> request) {
        
        try {
            String keyword = request.get("keyword");
            
            if (keyword == null || keyword.trim().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Keyword is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }
            
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            Integer adminUserId = Integer.parseInt(auth.getName());
            
            BannedKeyword bannedKeyword = bannedKeywordService.updateBannedKeyword(id, keyword, adminUserId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Banned keyword updated successfully");
            response.put("bannedKeyword", bannedKeyword);
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Invalid input");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to update banned keyword");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Cập nhật trạng thái từ khóa bị cấm
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateBannedKeywordStatus(
            @PathVariable Integer id, 
            @RequestBody Map<String, Boolean> request) {
        
        try {
            Boolean status = request.get("status");
            
            if (status == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Status is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }
            
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            Integer adminUserId = Integer.parseInt(auth.getName());
            
            BannedKeyword bannedKeyword = bannedKeywordService.updateBannedKeywordStatus(id, status, adminUserId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Banned keyword status updated successfully");
            response.put("bannedKeyword", bannedKeyword);
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Invalid input");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to update banned keyword status");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Xóa từ khóa bị cấm
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteBannedKeyword(@PathVariable Integer id) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            Integer adminUserId = Integer.parseInt(auth.getName());
            
            bannedKeywordService.deleteBannedKeyword(id, adminUserId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Banned keyword deleted successfully");
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Banned keyword not found");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to delete banned keyword");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Lấy từ khóa bị cấm theo trạng thái
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<Map<String, Object>> getBannedKeywordsByStatus(
            @PathVariable Boolean status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        try {
            Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                       Sort.by(sortBy).descending() : 
                       Sort.by(sortBy).ascending();
            
            Pageable pageable = PageRequest.of(page, size, sort);
            Page<BannedKeyword> bannedKeywords = bannedKeywordService.getBannedKeywordsByStatus(status, pageable);
            
            Map<String, Object> response = new HashMap<>();
            response.put("bannedKeywords", bannedKeywords.getContent());
            response.put("currentPage", bannedKeywords.getNumber());
            response.put("totalItems", bannedKeywords.getTotalElements());
            response.put("totalPages", bannedKeywords.getTotalPages());
            response.put("hasNext", bannedKeywords.hasNext());
            response.put("hasPrevious", bannedKeywords.hasPrevious());
            response.put("status", status);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to retrieve banned keywords by status");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Kiểm tra nội dung có chứa từ khóa bị cấm không
     */
    @PostMapping("/check-content")
    public ResponseEntity<Map<String, Object>> checkContent(@RequestBody Map<String, String> request) {
        try {
            String content = request.get("content");
            
            if (content == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Content is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }
            
            boolean containsBannedKeywords = bannedKeywordService.containsBannedKeywords(content);
            List<String> foundKeywords = bannedKeywordService.findBannedKeywordsInContent(content);
            
            Map<String, Object> response = new HashMap<>();
            response.put("containsBannedKeywords", containsBannedKeywords);
            response.put("foundKeywords", foundKeywords);
            response.put("isContentValid", !containsBannedKeywords);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to check content");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Lấy tất cả từ khóa đang hoạt động
     */
    @GetMapping("/active")
    public ResponseEntity<Map<String, Object>> getActiveBannedKeywords() {
        try {
            List<BannedKeyword> activeBannedKeywords = bannedKeywordService.getAllActiveKeywords();
            
            Map<String, Object> response = new HashMap<>();
            response.put("activeBannedKeywords", activeBannedKeywords);
            response.put("totalActive", activeBannedKeywords.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to retrieve active banned keywords");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}