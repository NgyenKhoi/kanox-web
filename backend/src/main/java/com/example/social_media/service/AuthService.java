package com.example.social_media.service;

import com.example.social_media.entity.User;
import com.example.social_media.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.example.social_media.dto.RegisterRequestDto;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Login by email or password
    public Optional<User> loginByEmail(String email, String rawPassword) {
        Optional<User> userOpt = userRepository.findByEmailAndStatusTrue(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (passwordEncoder.matches(rawPassword, user.getPassword())) {
                return Optional.of(user);
            }
        }
        return Optional.empty();
    }

    // Login by username and password
    public Optional<User> loginByUsername(String username, String rawPassword) {
        Optional<User> userOpt = userRepository.findByUsernameAndStatusTrue(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (passwordEncoder.matches(rawPassword, user.getPassword())) {
                return Optional.of(user);
            }
        }
        return Optional.empty();
    }
    //user can log in by username or email + password in login form
    public Optional<User> loginFlexible(String identifier, String rawPassword) {
        if (identifier.contains("@")) {
            return loginByEmail(identifier, rawPassword); // login by email
        } else {
            return loginByUsername(identifier, rawPassword); // login by username
        }
    }


    // Logout
    public void logout(User user) {
        user.setPersistentCookie(null);
        userRepository.save(user);
    }

    // Remember me: create token and save
    public String rememberMe(User user) {
        String token = UUID.randomUUID().toString();
        user.setPersistentCookie(token);
        userRepository.save(user);
        return token;
    }
    //login by persistent cookie
    public Optional<User> loginByPersistentCookie(String cookie) {
        return userRepository.findByPersistentCookie(cookie);
    }
    //forgot password
    public boolean forgotPassword(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            // TODO: tạo token reset password, gửi mail cho user
            return true;
        }
        return false;
    }

    // view profile
    public Optional<User> getProfile(Integer userId) {
        return userRepository.findById(userId);
    }

    public Optional<User> getProfileByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public User register(RegisterRequestDto dto) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Email đã được sử dụng");
        }

        User user = new User();
        user.setUsername(dto.getUsername());
        user.setEmail(dto.getEmail());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        LocalDate dob = LocalDate.of(dto.getYear(), dto.getMonth(), dto.getDay());
        user.setDateOfBirth(dob);
        user.setStatus(true);
        return userRepository.save(user);
    }
}