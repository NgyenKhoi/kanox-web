package com.example.social_media.controller;

import com.example.social_media.entity.ContentPolicy;
import com.example.social_media.service.ContentPolicyService;
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
@RequestMapping("/admin/content-policies")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class ContentPolicyController {
    
    private final ContentPolicyService contentPolicyService;
    
    @Autowired
    public ContentPolicyController(ContentPolicyService contentPolicyService) {
        this.contentPolicyService = contentPolicyService;
    }
    
    /**
     * Lấy tất cả chính sách nội dung với phân trang
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllContentPolicies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        try {
            Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                       Sort.by(sortBy).descending() : 
                       Sort.by(sortBy).ascending();
            
            Pageable pageable = PageRequest.of(page, size, sort);
            Page<ContentPolicy> contentPolicies = contentPolicyService.getAllContentPolicies(pageable);
            
            Map<String, Object> response = new HashMap<>();
            response.put("contentPolicies", contentPolicies.getContent());
            response.put("currentPage", contentPolicies.getNumber());
            response.put("totalItems", contentPolicies.getTotalElements());
            response.put("totalPages", contentPolicies.getTotalPages());
            response.put("hasNext", contentPolicies.hasNext());
            response.put("hasPrevious", contentPolicies.hasPrevious());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to retrieve content policies");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Tìm kiếm chính sách nội dung theo tên
     */
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchContentPolicies(
            @RequestParam String searchTerm,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        try {
            Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                       Sort.by(sortBy).descending() : 
                       Sort.by(sortBy).ascending();
            
            Pageable pageable = PageRequest.of(page, size, sort);
            Page<ContentPolicy> contentPolicies = contentPolicyService.searchContentPolicies(searchTerm, pageable);
            
            Map<String, Object> response = new HashMap<>();
            response.put("contentPolicies", contentPolicies.getContent());
            response.put("currentPage", contentPolicies.getNumber());
            response.put("totalItems", contentPolicies.getTotalElements());
            response.put("totalPages", contentPolicies.getTotalPages());
            response.put("hasNext", contentPolicies.hasNext());
            response.put("hasPrevious", contentPolicies.hasPrevious());
            response.put("searchTerm", searchTerm);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to search content policies");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Tìm kiếm chính sách theo mô tả
     */
    @GetMapping("/search-by-description")
    public ResponseEntity<Map<String, Object>> searchContentPoliciesByDescription(
            @RequestParam String description,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        try {
            Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                       Sort.by(sortBy).descending() : 
                       Sort.by(sortBy).ascending();
            
            Pageable pageable = PageRequest.of(page, size, sort);
            Page<ContentPolicy> contentPolicies = contentPolicyService.searchContentPoliciesByDescription(description, pageable);
            
            Map<String, Object> response = new HashMap<>();
            response.put("contentPolicies", contentPolicies.getContent());
            response.put("currentPage", contentPolicies.getNumber());
            response.put("totalItems", contentPolicies.getTotalElements());
            response.put("totalPages", contentPolicies.getTotalPages());
            response.put("hasNext", contentPolicies.hasNext());
            response.put("hasPrevious", contentPolicies.hasPrevious());
            response.put("description", description);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to search content policies by description");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Lấy chính sách nội dung theo ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getContentPolicyById(@PathVariable Integer id) {
        try {
            ContentPolicy contentPolicy = contentPolicyService.getContentPolicyById(id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("contentPolicy", contentPolicy);
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Content policy not found");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to retrieve content policy");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Tạo chính sách nội dung mới
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createContentPolicy(@RequestBody Map<String, String> request) {
        try {
            String policyName = request.get("policyName");
            String description = request.get("description");
            
            if (policyName == null || policyName.trim().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Policy name is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }
            
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            Integer adminUserId = Integer.parseInt(auth.getName());
            
            ContentPolicy contentPolicy = contentPolicyService.createContentPolicy(policyName, description, adminUserId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Content policy created successfully");
            response.put("contentPolicy", contentPolicy);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Invalid input");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to create content policy");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Cập nhật chính sách nội dung
     */
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateContentPolicy(
            @PathVariable Integer id, 
            @RequestBody Map<String, String> request) {
        
        try {
            String policyName = request.get("policyName");
            String description = request.get("description");
            
            if (policyName == null || policyName.trim().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Policy name is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }
            
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            Integer adminUserId = Integer.parseInt(auth.getName());
            
            ContentPolicy contentPolicy = contentPolicyService.updateContentPolicy(id, policyName, description, adminUserId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Content policy updated successfully");
            response.put("contentPolicy", contentPolicy);
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Invalid input");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to update content policy");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Cập nhật trạng thái chính sách nội dung
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateContentPolicyStatus(
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
            
            ContentPolicy contentPolicy = contentPolicyService.updateContentPolicyStatus(id, status, adminUserId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Content policy status updated successfully");
            response.put("contentPolicy", contentPolicy);
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Invalid input");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to update content policy status");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Xóa chính sách nội dung
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteContentPolicy(@PathVariable Integer id) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            Integer adminUserId = Integer.parseInt(auth.getName());
            
            contentPolicyService.deleteContentPolicy(id, adminUserId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Content policy deleted successfully");
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Content policy not found");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to delete content policy");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Lấy chính sách nội dung theo trạng thái
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<Map<String, Object>> getContentPoliciesByStatus(
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
            Page<ContentPolicy> contentPolicies = contentPolicyService.getContentPoliciesByStatus(status, pageable);
            
            Map<String, Object> response = new HashMap<>();
            response.put("contentPolicies", contentPolicies.getContent());
            response.put("currentPage", contentPolicies.getNumber());
            response.put("totalItems", contentPolicies.getTotalElements());
            response.put("totalPages", contentPolicies.getTotalPages());
            response.put("hasNext", contentPolicies.hasNext());
            response.put("hasPrevious", contentPolicies.hasPrevious());
            response.put("status", status);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to retrieve content policies by status");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Kiểm tra nội dung có vi phạm chính sách không
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
            
            boolean violatesPolicy = contentPolicyService.violatesContentPolicy(content);
            boolean isContentValid = contentPolicyService.isContentValid(content);
            
            Map<String, Object> response = new HashMap<>();
            response.put("violatesPolicy", violatesPolicy);
            response.put("isContentValid", isContentValid);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to check content");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Lấy tất cả chính sách đang hoạt động
     */
    @GetMapping("/active")
    public ResponseEntity<Map<String, Object>> getActivePolicies() {
        try {
            List<ContentPolicy> activePolicies = contentPolicyService.getAllActivePolicies();
            
            Map<String, Object> response = new HashMap<>();
            response.put("activePolicies", activePolicies);
            response.put("totalActive", activePolicies.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to retrieve active content policies");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}