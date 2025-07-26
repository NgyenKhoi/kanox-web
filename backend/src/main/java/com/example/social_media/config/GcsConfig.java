package com.example.social_media.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.FileInputStream;
import java.io.IOException;
import java.util.List;

@Configuration
public class GcsConfig {

    @Value("${gcp.credentials.filepath}")
    private String credentialsPath;

    @Value("${spring.cloud.gcp.project-id}")
    private String projectId;

    @Bean
    public Storage googleCloudStorage() throws IOException {
        GoogleCredentials credentials = GoogleCredentials
                .getApplicationDefault() // ✅ Dùng mặc định từ GOOGLE_APPLICATION_CREDENTIALS
                .createScoped(List.of("https://www.googleapis.com/auth/cloud-platform"));

        return StorageOptions.newBuilder()
                .setProjectId(projectId)
                .setCredentials(credentials)
                .build()
                .getService();
    }
}
