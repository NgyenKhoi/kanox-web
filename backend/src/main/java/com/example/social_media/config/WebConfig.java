package com.example.social_media.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                // Áp dụng chính sách CORS cho tất cả các endpoint bắt đầu bằng /api/
                registry.addMapping("/api/**")
                        // Cho phép request từ domain Netlify của bạn
                        .allowedOrigins("https://kanox-social-media.netlify.app")
                        // Cho phép các phương thức HTTP này
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        // Cho phép tất cả các header (bao gồm cả 'Authorization')
                        .allowedHeaders("*")
                        // Cho phép gửi cookie hoặc thông tin xác thực
                        .allowCredentials(true);
            }
        };
    }
}
