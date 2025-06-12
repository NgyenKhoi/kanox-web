package com.example.social_media.service;

import com.example.social_media.entity.User;
import com.example.social_media.exception.InvalidPasswordException;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("Người dùng không tồn tại với username: " + username));
        if (!user.getStatus()) {
            throw new UserNotFoundException("Người dùng đã bị vô hiệu hóa");
        }
        if (user.getPassword() == null || user.getPassword().isEmpty()) {
            throw new InvalidPasswordException("Mật khẩu không hợp lệ");
        }
        return org.springframework.security.core.userdetails.User
                .withUsername(user.getUsername())
                .password(user.getPassword())
                .roles("USER")
                .build();
    }

    // Thêm phương thức để lấy User object
    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("Người dùng không tồn tại với username: " + username));
    }

    public User getUserById(Integer userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("Người dùng không tồn tại với username: " + userId));
    }
}