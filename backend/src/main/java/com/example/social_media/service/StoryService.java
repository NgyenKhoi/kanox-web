//package com.example.social_media.service;
//
//import com.example.social_media.entity.Story;
//import com.example.social_media.entity.User;
//import com.example.social_media.exception.UserNotFoundException;
//import com.example.social_media.repository.StoryRepository;
//import com.example.social_media.repository.UserRepository;
//import org.slf4j.Logger;
//import org.slf4j.LoggerFactory;
//import org.springframework.stereotype.Service;
//import org.springframework.transaction.annotation.Transactional;
//import org.springframework.web.multipart.MultipartFile;
//
//import java.io.IOException; // Cần import IOException
//import java.util.List;
//
//@Service
//public class StoryService {
//
//    private static final Logger logger = LoggerFactory.getLogger(StoryService.class);
//
//    private final StoryRepository storyRepository;
//    private final UserRepository userRepository;
//    private final MediaService mediaService; // Dùng để upload file và lấy URL
//
//    public StoryService(StoryRepository storyRepository, UserRepository userRepository, MediaService mediaService) {
//        this.storyRepository = storyRepository;
//        this.userRepository = userRepository;
//        this.mediaService = mediaService;
//    }
//
//    /**
//     * Phương thức chính để tạo một story mới. Luồng logic: Upload file để lấy
//     * URL -> Gọi Stored Procedure với URL đó.
//     */
//    @Transactional
//    public void createStory(String username, MultipartFile videoFile, String privacy) {
//        logger.info("User '{}' is creating a new story with privacy '{}'", username, privacy);
//
//        // 1. Tìm người dùng trong DB
//        User user = userRepository.findByUsernameAndStatusTrue(username)
//                .orElseThrow(() -> new UserNotFoundException("User not found or is inactive: " + username));
//
//        // 2. Kiểm tra các giá trị đầu vào
//        if (videoFile == null || videoFile.isEmpty()) {
//            throw new IllegalArgumentException("Video file cannot be empty.");
//        }
//        if (!List.of("public", "friends", "only_me").contains(privacy)) {
//            throw new IllegalArgumentException("Invalid privacy setting provided: " + privacy);
//        }
//
//        String mediaUrl;
////        try {
////            mediaUrl = mediaService.uploadFileAndGetUrl(videoFile, "stories"); // "stories" là thư mục con trên GCS
////        } catch (IOException e) {
////            logger.error("Failed to upload story video file for user '{}'", username, e);
////            throw new RuntimeException("Could not upload video file.", e);
////        }
//
////        logger.debug("Story video uploaded to GCS. URL: {}", mediaUrl);
//
//        // 4. GỌI STORED PROCEDURE với các tham số đã chuẩn bị
//        try {
//            Integer newStoryId = storyRepository.createStory(
//                    user.getId(),
//                    null, // caption (chưa có)
//                    mediaUrl, // URL của file video đã upload
//                    "video", // media_type
//                    privacy, // privacy_setting
//                    null, // background_color (không dùng cho video)
//                    null // custom_list_id (chưa hỗ trợ)
//            );
//
//            if (newStoryId == null || newStoryId <= 0) {
//                // Stored procedure có thể trả về lỗi qua RAISERROR, sẽ bị bắt ở catch block
//                throw new RuntimeException("Stored procedure sp_CreateStory failed to return a valid new story ID.");
//            }
//
//            logger.info("Successfully created story with ID: {} by calling sp_CreateStory.", newStoryId);
//
//        } catch (Exception e) {
//            logger.error("Error executing sp_CreateStory for user '{}'. Error: {}", username, e.getMessage());
//            // Ném lại exception để client nhận được thông báo lỗi từ DB (ví dụ: "Nội dung chứa từ khóa bị cấm.")
//            throw new RuntimeException("Database error while creating story: " + e.getMessage(), e);
//        }
//    }
//}
