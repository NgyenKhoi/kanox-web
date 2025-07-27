package com.example.social_media.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import vn.payos.PayOS;
@EnableConfigurationProperties(PayOSProperties.class)
@Configuration
@RequiredArgsConstructor
public class PayOSConfig {

    @Bean
    public PayOS payOS(PayOSProperties props) {
        return new PayOS(props.getClientId(), props.getApiKey(), props.getChecksumKey());
    }
}
