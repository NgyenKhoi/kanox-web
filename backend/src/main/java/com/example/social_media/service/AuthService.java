package com.example.social_media.service;

import com.example.social_media.config.URLConfig;
import com.example.social_media.dto.authentication.RegisterRequestDto;
import com.example.social_media.entity.User;
import com.example.social_media.entity.VerificationToken;
import com.example.social_media.exception.EmailAlreadyExistsException;
import com.example.social_media.exception.InvalidPasswordException;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.repository.UserRepository;
import com.example.social_media.repository.VerificationTokenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;

    private final PasswordEncoder passwordEncoder;

    private final VerificationTokenRepository verificationTokenRepository;

    private final MailService mailService;
    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    public AuthService(MailService mailService, UserRepository userRepository, PasswordEncoder passwordEncoder, VerificationTokenRepository verificationTokenRepository) {
        this.mailService = mailService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.verificationTokenRepository = verificationTokenRepository;
    }

    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public Optional<User> loginByEmail(String email, String rawPassword) {
        Optional<User> userOpt = userRepository.findByEmailAndStatusTrue(email);
        if (userOpt.isEmpty()) {
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
        if (userOpt.isEmpty()) {
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


    public boolean forgotPassword(String email) {
        logger.info("Processing forgot password for email: {}", email);

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            logger.warn("Email not found: {}", email);
            return false;
        }
        try {
            mailService.sendResetToken(email);
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
        Logger logger = LoggerFactory.getLogger(this.getClass());

        logger.info("Bắt đầu đăng ký user với username: {}", dto.getUsername());

        if (userRepository.existsByUsername(dto.getUsername())) {
            logger.warn("Username đã tồn tại: {}", dto.getUsername());
            throw new IllegalArgumentException("Username đã tồn tại");
        }
        if (userRepository.existsByEmail(dto.getEmail())) {
            logger.warn("Email đã được sử dụng: {}", dto.getEmail());
            throw new EmailAlreadyExistsException("Email đã được sử dụng");
        }

        // Xóa token cũ theo email (nếu có)
        Optional<VerificationToken> existingTokenOpt = verificationTokenRepository.findByEmail(dto.getEmail());
        existingTokenOpt.ifPresent(verificationTokenRepository::delete);

        String token = UUID.randomUUID().toString();
        logger.info("Tạo token xác thực: {}", token);

        VerificationToken verificationToken = new VerificationToken();
        verificationToken.setToken(token);
        verificationToken.setUsername(dto.getUsername());
        verificationToken.setEmail(dto.getEmail());
        verificationToken.setPassword(passwordEncoder.encode(dto.getPassword()));
        verificationToken.setPhoneNumber(dto.getPhoneNumber() != null ? dto.getPhoneNumber() : "");

        Instant now = Instant.now();
        verificationToken.setCreatedDate(now);
        Instant expiry = LocalDateTime.now().plusDays(1)
                .atZone(ZoneId.systemDefault())
                .toInstant();
        verificationToken.setExpiryDate(expiry);

        verificationTokenRepository.save(verificationToken);
        logger.info("Lưu VerificationToken thành công cho username: {}", dto.getUsername());

        // Gửi email xác thực
        String verificationLink = URLConfig.EMAIL_VERIFICATION + token;
        mailService.sendVerificationEmail(dto.getEmail(), verificationLink);
        logger.info("Email xác thực đã được gửi đến: {}", dto.getEmail());

        // Trả về null để client biết cần xác thực email trước
        return null;
    }

    public User verifyToken(String token) {
        VerificationToken verificationToken = verificationTokenRepository.findByToken(token);
        if (verificationToken == null) {
            throw new IllegalArgumentException("Token không tồn tại hoặc đã bị xoá.");
        }

        if (verificationToken.getExpiryDate().isBefore(Instant.now())) {
            verificationTokenRepository.delete(verificationToken);
            throw new IllegalArgumentException("Token đã hết hạn.");
        }

        User user = new User();
        user.setUsername(verificationToken.getUsername());
        user.setEmail(verificationToken.getEmail());
        user.setPassword(verificationToken.getPassword());
        user.setPhoneNumber(verificationToken.getPhoneNumber());
        user.setStatus(true);

        User savedUser = userRepository.save(user);

        // Xóa token sau khi xác thực thành công
        verificationTokenRepository.delete(verificationToken);

        return savedUser;
    }

    public User loginOrRegisterGoogleUser(String googleId, String email, String name) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        //check if login google have the same email as existing user
        if (userOpt.isPresent()) {
            User existingUser = userOpt.get();

            // user don't have Google id will set into here
            if (existingUser.getGoogleId() == null) {
                existingUser.setGoogleId(googleId);
                userRepository.save(existingUser);
            }

            return existingUser;
        }
        String tempPassword = UUID.randomUUID().toString().substring(0, 8);
        //take username from google login
        User newUser = new User();
        String baseUsername = name.replaceAll("\\s+", "").toLowerCase();
        String finalUsername = baseUsername;
        int i = 1;
        while (userRepository.existsByUsername(finalUsername)) {
            finalUsername = baseUsername + i;
            i++;
        }
        newUser.setUsername(finalUsername);
        newUser.setEmail(email);
        newUser.setGoogleId(googleId);
        newUser.setPassword(passwordEncoder.encode(tempPassword));
        mailService.sendTemporaryPasswordEmail(email, tempPassword);
        return userRepository.save(newUser);
    }
}