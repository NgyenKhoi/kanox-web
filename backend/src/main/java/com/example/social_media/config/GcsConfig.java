package com.example.social_media.config;

import com.google.api.client.util.Value;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.storage.StorageOptions;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import com.google.cloud.storage.Storage;


import java.io.IOException;
import java.io.InputStream;

@Configuration
public class GcsConfig {

    @Value("${spring.cloud.gcp.credentials.location}")
    private String credentialsLocation;

    @Value("${spring.cloud.gcp.project-id}")
    private String projectId;

    @Bean
    public Storage storage() throws Exception {
        try (InputStream credentialsStream = getClass().getResourceAsStream(credentialsLocation.replace("classpath:", "/"))) {
            GoogleCredentials credentials = GoogleCredentials
                    .fromStream(credentialsStream)
                    .createScoped("https://www.googleapis.com/auth/devstorage.read_write"); // ✅ BẮT BUỘC

            return StorageOptions.newBuilder()
                    .setCredentials(credentials)
                    .setProjectId(projectId)
                    .build()
                    .getService();
        }
    }
}
