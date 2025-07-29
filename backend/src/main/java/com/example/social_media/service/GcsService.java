package com.example.social_media.service;

import com.google.cloud.storage.Acl;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils; // Cần import StringUtils
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.UUID;

@Service
public class GcsService {

    private static final Logger logger = LoggerFactory.getLogger(GcsService.class);

    @Value("${gcs.bucket.name}")
    private String bucketName;

    private final Storage storage;
    private static final String FORMAT_URL_UPLOAD = "https://storage.googleapis.com/%s/%s";

    public GcsService(Storage storage) {
        this.storage = storage;
    }

    /**
     * Phương thức upload file gốc. Sẽ upload file vào thư mục gốc của bucket.
     *
     * @param file File cần upload
     * @return URL công khai của file
     * @throws IOException
     */
    public String uploadFile(MultipartFile file) throws IOException {
        // Gọi phiên bản mới với thư mục con là chuỗi rỗng
        return this.uploadFile(file, "");
    }

    /**
     * [PHƯƠNG THỨC MỚI ĐƯỢC NẠP CHỒNG] Upload một file lên Google Cloud Storage
     * vào một thư mục con cụ thể.
     *
     * @param file File cần upload.
     * @param subfolder Tên thư mục con (ví dụ: "stories", "avatars"). Nếu rỗng
     * hoặc null, sẽ upload vào gốc.
     * @return URL công khai của file đã upload.
     * @throws IOException nếu có lỗi.
     */
    public String uploadFile(MultipartFile file, String subfolder) throws IOException {
        if (file == null || file.isEmpty()) {
            logger.error("Attempted to upload an empty or null file.");
            throw new IllegalArgumentException("File không được để trống");
        }

        // 1. Tạo tên file duy nhất để tránh trùng lặp
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String uniqueFileName = UUID.randomUUID().toString() + extension;

        // 2. Xử lý và tạo đường dẫn đối tượng (objectName) trên GCS
        String objectName;
        if (subfolder != null && !subfolder.trim().isEmpty()) {
            // Làm sạch tên thư mục để đảm bảo đường dẫn hợp lệ
            String cleanSubfolder = StringUtils.trimTrailingCharacter(StringUtils.trimLeadingCharacter(subfolder.trim(), '/'), '/');
            objectName = cleanSubfolder + "/" + uniqueFileName;
        } else {
            objectName = uniqueFileName;
        }

        logger.info("Uploading file to GCS: bucket={}, objectName={}", bucketName, objectName);

        // 3. Xây dựng thông tin và thực hiện upload
        BlobId blobId = BlobId.of(bucketName, objectName);
        BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                .setContentType(file.getContentType())
                // Đảm bảo file có thể được đọc công khai qua URL
                .setAcl(Arrays.asList(Acl.of(Acl.User.ofAllUsers(), Acl.Role.READER)))
                .build();

        try {
            storage.create(blobInfo, file.getBytes());
            String fileUrl = String.format(FORMAT_URL_UPLOAD, bucketName, objectName);
            logger.info("File uploaded successfully: url={}", fileUrl);
            return fileUrl;
        } catch (Exception e) {
            logger.error("Failed to upload file to GCS: {}", e.getMessage(), e);
            throw new IOException("Không thể tải file lên GCS: " + e.getMessage(), e);
        }
    }
}
