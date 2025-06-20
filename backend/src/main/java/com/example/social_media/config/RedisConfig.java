package com.example.social_media.config;

import com.example.social_media.dto.message.MessageDto;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@Configuration
public class RedisConfig {

    @Bean
    public LettuceConnectionFactory redisConnectionFactory() {
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration();
        config.setHostName("34.143.174.239");
        config.setPort(6379);
        config.setUsername("default");
        config.setPassword("eqfleqrd1");
        return new LettuceConnectionFactory(config);
    }

    @Bean
    public RedisTemplate<String, MessageDto> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, MessageDto> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        // Sử dụng Jackson2JsonRedisSerializer để serialize MessageDto
        Jackson2JsonRedisSerializer<MessageDto> serializer = new Jackson2JsonRedisSerializer<>(MessageDto.class);
        template.setValueSerializer(serializer);
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(serializer);
        template.afterPropertiesSet();
        return template;
    }
    @Bean
    RedisMessageListenerContainer container(RedisConnectionFactory connectionFactory,
                                            MessageListenerAdapter listenerAdapter) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        container.addMessageListener(listenerAdapter, new ChannelTopic("chat"));
        return container;
    }

    @Bean
    MessageListenerAdapter listenerAdapter(SimpMessagingTemplate messagingTemplate) {
        return new MessageListenerAdapter(new RedisMessageSubscriber(messagingTemplate));
    }
    @Bean
    public RedisMessageSubscriber subscriber(SimpMessagingTemplate messagingTemplate) {
        return new RedisMessageSubscriber(messagingTemplate);
    }

}