package com.example.social_media.config;

import com.example.social_media.jwt.JwtService;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.socket.server.support.HttpSessionHandshakeInterceptor;

import java.util.ArrayList;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Configuration
@EnableWebSocketMessageBroker
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtService jwtService;
    public final Map<String, String> sessionTokenMap = new ConcurrentHashMap<>();

    public WebSocketConfig(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableStompBrokerRelay("/topic", "/queue")
                .setRelayHost("34.143.174.239") // Thay bằng địa chỉ Redis sau
                .setRelayPort(6379)       // Cổng Redis
                .setSystemLogin("default")
                .setSystemPasscode("eqfleqrd1")
                .setClientLogin("default")
                .setClientPasscode("eqfleqrd1");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOrigins("https://kanox-web.netlify.app")
                .withSockJS()
                .setInterceptors(new HttpSessionHandshakeInterceptor() {
                    @Override
                    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
                        String token = request.getHeaders().getFirst("Authorization");
                        if (token != null && token.startsWith("Bearer ")) {
                            attributes.put("token", token);
                        }
                        return true;
                    }
                });
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authToken = accessor.getFirstNativeHeader("Authorization");
                    System.out.println("Received WebSocket CONNECT with token: " + authToken);
                    if (authToken != null && authToken.startsWith("Bearer ")) {
                        try {
                            String jwt = authToken.substring(7);
                            String username = jwtService.extractUsername(jwt);
                            System.out.println("Extracted username: " + username);
                            Authentication auth = new UsernamePasswordAuthenticationToken(username, null, new ArrayList<>());
                            SecurityContextHolder.getContext().setAuthentication(auth); // Đặt context
                            sessionTokenMap.put(accessor.getSessionId(), authToken);
                            System.out.println("Token saved for session " + accessor.getSessionId() + ": " + authToken);
                        } catch (Exception e) {
                            System.err.println("JWT validation failed: " + e.getMessage());
                        }
                    } else {
                        System.err.println("No valid Authorization header found");
                    }
                }
                return message;
            }
        });
    }
}