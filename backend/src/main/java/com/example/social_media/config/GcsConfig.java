package com.example.social_media.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.storage.StorageOptions;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import com.google.cloud.storage.Storage;
import org.springframework.core.io.ClassPathResource;


import java.io.IOException;
import java.util.List;

@Configuration
public class GcsConfig {

    @Bean
    public Storage googleCloudStorage() throws IOException {
        GoogleCredentials credentials = GoogleCredentials
                .fromStream(new ClassPathResource("gcp-credentials.json").getInputStream())
                .createScoped(List.of("https://www.googleapis.com/auth/cloud-platform"));

        return StorageOptions.newBuilder()
                .setProjectId("social-media-cicd")
                .setCredentials(credentials)
                .build()
                .getService();
    }
}
