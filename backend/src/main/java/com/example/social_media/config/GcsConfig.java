package com.example.social_media.config;

import com.google.cloud.storage.StorageOptions;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import com.google.cloud.storage.Storage;


import java.io.IOException;

@Configuration
public class GcsConfig {

    @Bean
    public Storage storage() throws IOException {
        return StorageOptions.getDefaultInstance().getService();
    }
}
