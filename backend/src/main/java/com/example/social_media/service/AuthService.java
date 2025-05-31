package com.example.social_media.service;

import com.example.social_media.entity.User;
import com.example.social_media.repository.UserRepository;
import com.example.social_media.dto.RegisterRequestDto;
import com.example.social_media.exception.EmailAlreadyExistsException;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.exception.InvalidPasswordException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.DateTimeException;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private final PasswordResetService passwordResetService;
    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    public AuthService(PasswordResetService passwordResetService) {
        this.passwordResetService = passwordResetService;
    }

    public Optional<User> loginByEmail(String email, String rawPassword) {
        Optional<User> userOpt = userRepository.findByEmailAndStatusTrue(email);
        if (!userOpt.isPresent()) {
            throw new UserNotFoundException("Người dùng không tồn tại hoặc bị vô hiệu hóa");
        }
        User user = userOpt.get();
        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new InvalidPasswordException("Mật khẩu không đúng");
        }
        return Optional.of(user);
    }

    public Optional<User> loginByUsername(String username, String rawPassword) {
        Optional<User> userOpt = userRepository.findByUsernameAndStatusTrue(username);
        if (!userOpt.isPresent()) {
            throw new UserNotFoundException("Người dùng không tồn tại hoặc bị vô hiệu hóa");
        }
        User user = userOpt.get();
        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new InvalidPasswordException("Mật khẩu không đúng");
        }
        return Optional.of(user);
    }

    public Optional<User> loginFlexible(String identifier, String rawPassword) {
        if (identifier.contains("@")) {
            return loginByEmail(identifier, rawPassword);
        } else {
            return loginByUsername(identifier, rawPassword);
        }
    }

    public void logout(User user) {
        if (user == null) {
            throw new UserNotFoundException("Người dùng không tồn tại");
        }
        user.setPersistentCookie(null);
        userRepository.save(user);
    }

    public String rememberMe(User user) {
        if (user == null) {
            throw new UserNotFoundException("Người dùng không tồn tại");
        }
        String token = UUID.randomUUID().toString();
        user.setPersistentCookie(token);
        userRepository.save(user);
        return token;
    }

    public boolean forgotPassword(String email) {
        logger.info("Processing forgot password for email: {}", email);

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            logger.warn("Email not found: {}", email);
            return false;
        }
        try {
            passwordResetService.sendResetToken(email);
            logger.info("Password reset token sent to email: {}", email);
            return true;
        } catch (Exception e) {
            logger.error("Failed to send password reset email to {}: {}", email, e.getMessage());
            return false;
        }
    }

    public Optional<User> getUser(Integer userId) {
        return Optional.ofNullable(userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("Người dùng không tồn tại")));
    }

    public User register(RegisterRequestDto dto) {
        logger.info("Starting registration process for user: {}", dto.getUsername());
        try {
            // Validate username format
            if (!dto.getUsername().matches("^[A-Za-z0-9]+$")) {
                throw new IllegalArgumentException("Username chỉ được chứa chữ cái và số");
            }

            // Validate email format
            if (!dto.getEmail().matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
                throw new IllegalArgumentException("Email không hợp lệ");
            }

            // Validate password strength
            if (!dto.getPassword().matches("^(?=.*[A-Z])(?=.*[!@#$%^&*()_+=.])(?=.{8,}).*$")) {
                throw new IllegalArgumentException("Mật khẩu phải dài ít nhất 8 ký tự, chứa ít nhất 1 chữ cái in hoa và 1 ký tự đặc biệt");
            }

            // Check if username exists
            if (userRepository.existsByUsername(dto.getUsername())) {
                throw new IllegalArgumentException("Username đã tồn tại");
            }

            // Check if email exists
            if (userRepository.existsByEmail(dto.getEmail())) {
                throw new EmailAlreadyExistsException("Email đã được sử dụng");
            }

            logger.info("Creating new user with username: {}", dto.getUsername());
            User user = new User();
            user.setUsername(dto.getUsername());
            user.setEmail(dto.getEmail());
            user.setPassword(passwordEncoder.encode(dto.getPassword()));
            
            // Validate and set date of birth
            try {
                LocalDate dob = LocalDate.of(dto.getYear(), dto.getMonth(), dto.getDay());
                user.setDateOfBirth(dob);
            } catch (DateTimeException e) {
                throw new IllegalArgumentException("Ngày sinh không hợp lệ");
            }

            user.setDisplayName(dto.getDisplayName());
            user.setPhoneNumber(dto.getPhoneNumber());
            user.setBio(dto.getBio());
            
            // Convert gender string to short
            Short genderValue;
            String genderStr = dto.getGender().toUpperCase();
            switch (genderStr) {
                case "MALE":
                    genderValue = 0;
                    break;
                case "FEMALE":
                    genderValue = 1;
                    break;
                case "OTHER":
                default:
                    genderValue = 2;
                    break;
            }
            user.setGender(genderValue);
            
            user.setStatus(true);
            
            logger.info("Saving user to database: {}", user.getUsername());
            User savedUser = userRepository.save(user);
            logger.info("User registered successfully: {}", savedUser.getUsername());
            return savedUser;
        } catch (Exception e) {
            logger.error("Error during user registration: ", e);
            throw e;
        }
    }
}