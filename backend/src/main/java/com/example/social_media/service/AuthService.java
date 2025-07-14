package com.example.social_media.service;

import com.example.social_media.config.URLConfig;
import com.example.social_media.dto.authentication.RegisterRequestDto;
import com.example.social_media.entity.User;
import com.example.social_media.entity.VerificationToken;
import com.example.social_media.entity.VerifiedEmail;
import com.example.social_media.exception.EmailAlreadyExistsException;
import com.example.social_media.exception.InvalidPasswordException;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.repository.UserRepository;
import com.example.social_media.repository.VerificationTokenRepository;
import com.example.social_media.repository.VerifiedEmailRepository;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Duration;
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
    private final DataSyncService dataSyncService;
    private final VerifiedEmailRepository verifiedEmailRepository;


    public AuthService(MailService mailService, UserRepository userRepository, PasswordEncoder passwordEncoder, VerificationTokenRepository verificationTokenRepository, DataSyncService dataSyncService,
                       VerifiedEmailRepository verifiedEmailRepository) {
        this.mailService = mailService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.verificationTokenRepository = verificationTokenRepository;
        this.dataSyncService = dataSyncService;
        this.verifiedEmailRepository = verifiedEmailRepository;
    }

    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsernameAndStatusTrue(username);
    }

    public Optional<User> loginFlexible(String identifier, String rawPassword) {
        if (identifier == null || rawPassword == null) {
            logger.warn("Identifier or password is null");
            throw new IllegalArgumentException("Thông tin đăng nhập không được để trống");
        }
        if (identifier.contains("@")) {
            return loginByEmail(identifier, rawPassword);
        } else {
            return loginByUsername(identifier, rawPassword);
        }
    }

    public Optional<User> loginByEmail(String email, String rawPassword) {
        if (email == null || rawPassword == null) {
            logger.warn("Email or password is null");
            throw new IllegalArgumentException("Email hoặc mật khẩu không được để trống");
        }
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
        if (username == null || rawPassword == null) {
            logger.warn("Username or password is null");
            throw new IllegalArgumentException("Tên người dùng hoặc mật khẩu không được để trống");
        }
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
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("Người dùng không tồn tại"));
        if (!user.getStatus()) {
            throw new UserNotFoundException("Tài khoản đã bị khóa");
        }
        return Optional.of(user);
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
        user.setIsAdmin(false);

        User savedUser = userRepository.save(user);
        dataSyncService.syncUserToElasticsearch(savedUser.getId());
        verificationTokenRepository.delete(verificationToken);
        return savedUser;
    }

    public User loginOrRegisterGoogleUser(String googleId, String email, String name) {
        logger.info("Processing Google login for email: {}, googleId: {}", email, googleId);

        // Kiểm tra user với status = true
        Optional<User> userOpt = userRepository.findByEmailAndStatusTrue(email);
        if (userOpt.isPresent()) {
            User existingUser = userOpt.get();
            logger.info("Active user found with email: {}, username: {}", email, existingUser.getUsername());
            if (existingUser.getGoogleId() == null) {
                logger.info("Linking Google ID to existing active user: {}", email);
                existingUser.setGoogleId(googleId);
                try {
                    userRepository.save(existingUser);
                    logger.info("Updated googleId for user: {}", existingUser.getUsername());
                } catch (Exception e) {
                    logger.error("Error updating googleId for user: {}", email, e);
                    throw new IllegalStateException("Không thể liên kết Google ID với tài khoản hiện có: " + e.getMessage());
                }
            } else if (!existingUser.getGoogleId().equals(googleId)) {
                logger.warn("Email {} is already linked to another Google account", email);
                throw new IllegalStateException("Email đã được liên kết với một tài khoản Google khác");
            }
            return existingUser;
        }

        // Kiểm tra user với status = false (không cho phép đăng nhập)
        Optional<User> inactiveUserOpt = userRepository.findByEmail(email);
        if (inactiveUserOpt.isPresent()) {
            User inactiveUser = inactiveUserOpt.get();
            if (!inactiveUser.getStatus()) {
                logger.warn("Blocked user attempted to login with email: {}", email);
                throw new IllegalStateException("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
            }
        }

        // Tạo user mới nếu không tìm thấy
        logger.info("Creating new user with email: {}", email);
        String baseUsername = email.split("@")[0].toLowerCase();

        // Giới hạn 30 ký tự
        baseUsername = baseUsername.length() > 30 ? baseUsername.substring(0, 30) : baseUsername;

        String username = baseUsername;
        int suffix = 1;

        while (userRepository.existsByUsername(username)) {
            String suffixStr = String.valueOf(suffix++);
            int maxLength = 30 - suffixStr.length();
            username = baseUsername.substring(0, Math.min(baseUsername.length(), maxLength)) + suffixStr;
        }

        String tempPassword = UUID.randomUUID().toString().substring(0, 8);
        User newUser = new User();
        newUser.setUsername(username);
        newUser.setEmail(email);
        newUser.setDisplayName(baseUsername);
        newUser.setGoogleId(googleId);
        newUser.setPassword(passwordEncoder.encode(tempPassword));
        newUser.setStatus(true);
        newUser.setProfilePrivacySetting("default");
        newUser.setIsAdmin(false);

        try {
            User savedUser = userRepository.save(newUser);
            logger.info("New user created: {}", savedUser.getUsername());
            dataSyncService.syncUserToElasticsearch(savedUser.getId());
            try {
                mailService.sendTemporaryPasswordEmail(email, tempPassword);
                logger.info("Temporary password email sent to: {}", email);
            } catch (Exception e) {
                logger.error("Failed to send temporary password email to {}: {}", email, e.getMessage());
            }

            return savedUser;
        } catch (DataIntegrityViolationException e) {
            logger.error("Database error saving user with email: {}, detail: {}", email, e.getMessage());
            if (e.getMessage().contains("email")) {
                throw new IllegalStateException("Email đã tồn tại: " + email);
            } else if (e.getMessage().contains("username")) {
                throw new IllegalStateException("Username đã tồn tại: " + username);
            } else {
                throw new IllegalStateException("Không thể tạo user: vi phạm ràng buộc dữ liệu - " + e.getMessage());
            }
        } catch (ConstraintViolationException e) {
            logger.error("Constraint violation saving user with email: {}, detail: {}", email, e.getMessage());
            throw new IllegalStateException("Không thể tạo user: dữ liệu không hợp lệ - " + e.getMessage());
        } catch (Exception e) {
            logger.error("Unexpected error saving user with email: {}, detail: {}", email, e.getMessage());
            throw new IllegalStateException("Không thể tạo user: " + e.getMessage());
        }
    }

    public void changePassword(User user, String currentPassword, String newPassword, String confirmPassword) {
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new InvalidPasswordException("Mật khẩu hiện tại không đúng");
        }

        if (!newPassword.equals(confirmPassword)) {
            throw new IllegalArgumentException("Mật khẩu mới không khớp");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public void sendVerificationEmail(String email, User user) {
        String code = UUID.randomUUID().toString();
        VerifiedEmail ve = new VerifiedEmail();
        ve.setUser(user);
        ve.setEmail(email);
        ve.setVerified(false);
        ve.setVerificationCode(code);
        ve.setCreatedAt(Instant.now());
        verifiedEmailRepository.save(ve);

        String verifyLink = URLConfig.EMAIL_VERIFY_EXTRA + code;
        mailService.sendEmailVerificationLink(email, verifyLink); // hoặc gửi code
    }

    public void verifyEmailCode(String code) {
        VerifiedEmail ve = verifiedEmailRepository.findByVerificationCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Mã xác minh không hợp lệ"));

        if (ve.isVerified()) {
            throw new IllegalArgumentException("Email đã được xác minh");
        }

        if (Duration.between(ve.getCreatedAt(), Instant.now()).toMinutes() > 10) {
            throw new IllegalArgumentException("Mã xác minh đã hết hạn");
        }

        ve.setVerified(true);
        verifiedEmailRepository.save(ve);
    }
}