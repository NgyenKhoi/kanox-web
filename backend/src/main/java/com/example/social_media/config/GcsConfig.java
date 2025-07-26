package com.example.social_media.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.FileInputStream;
import java.io.InputStream;
import java.util.List;

@Configuration
public class GcsConfig {

    @Value("${spring.cloud.gcp.credentials.location}")
    private String credentialsLocation;

    @Value("${spring.cloud.gcp.project-id}")
    private String projectId;

    @Bean
    public Storage googleCloudStorage() throws Exception {
        InputStream serviceAccountStream = resolveCredentialInputStream(credentialsLocation);

        GoogleCredentials credentials = GoogleCredentials
                .fromStream(serviceAccountStream)
                .createScoped(List.of("https://www.googleapis.com/auth/cloud-platform"));

        return StorageOptions.newBuilder()
                .setProjectId(projectId)
                .setCredentials(credentials)
                .build()
                .getService();
    }

    private InputStream resolveCredentialInputStream(String location) throws Exception {
        if (location.startsWith("classpath:")) {
            String path = location.replace("classpath:", "");
            return getClass().getClassLoader().getResourceAsStream(path);
        } else if (location.startsWith("file:")) {
            String path = location.replace("file:", "");
            return new FileInputStream(path);
        } else {
            throw new IllegalArgumentException("Unsupported credential path: " + location);
        }
    }
}
