package com.example.social_media.service;

import com.example.social_media.config.URLConfig;
import com.example.social_media.entity.PasswordReset;
import com.example.social_media.entity.User;
import com.example.social_media.exception.InvalidTokenException;
import com.example.social_media.exception.TokenExpiredException;
import com.example.social_media.exception.UserNotFoundException;
import com.example.social_media.repository.PasswordResetRepository;
import com.example.social_media.repository.UserRepository;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class PasswordResetService {

    private final PasswordResetRepository passwordResetRepository;

    private final UserRepository userRepository;

    private final JavaMailSender mailSender;

    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[A-Za-z0-9+_.-]+@([A-Za-z0-9.-]+\\.[A-Za-z]{2,})$"
    );

    public PasswordResetService(PasswordResetRepository passwordResetRepository, UserRepository userRepository, JavaMailSender mailSender) {
        this.passwordResetRepository = passwordResetRepository;
        this.userRepository = userRepository;
        this.mailSender = mailSender;
    }

    public void sendResetToken(String email) {
        // Kiểm tra định dạng email
        if (email == null || email.trim().isEmpty() || !isValidEmail(email)) {
            throw new IllegalArgumentException("Định dạng email không hợp lệ");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("Email không tồn tại"));

        PasswordReset reset = new PasswordReset();
        reset.setUser(user);
        reset.setToken(UUID.randomUUID().toString());
        reset.setTokenExpireTime(Instant.now().plusSeconds(3600)); // 1 giờ
        reset.setIsUsed(false);
        reset.setStatus(true);

        try {
            passwordResetRepository.save(reset);
            sendEmail(email, reset.getToken());
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi lưu token hoặc gửi email: " + e.getMessage());
        }
    }

    private boolean isValidEmail(String email) {
        return EMAIL_PATTERN.matcher(email).matches();
    }

    private void sendEmail(String toEmail, String token) {
        String resetLink = URLConfig.FRONTEND_RESET_PASSWORD_URL + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Yêu cầu đặt lại mật khẩu");
        message.setText("Bấm vào liên kết sau để đặt lại mật khẩu:\n" + resetLink);

        try {
            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi gửi email: " + e.getMessage());
        }
    }

    public void resetPassword(String token, String newPassword) {
        PasswordReset reset = passwordResetRepository.findByTokenAndStatusIsTrueAndIsUsedIsFalse(token)
                .orElseThrow(() -> new InvalidTokenException("Token không hợp lệ hoặc đã sử dụng"));

        if (reset.getTokenExpireTime().isBefore(Instant.now())) {
            throw new TokenExpiredException("Token đã hết hạn");
        }

        if (newPassword == null || newPassword.isEmpty()) {
            throw new IllegalArgumentException("Mật khẩu mới không được để trống");
        }

        User user = reset.getUser();
        if (user == null) {
            throw new UserNotFoundException("Người dùng liên kết với token không tồn tại");
        }

        try {
            user.setPassword(new BCryptPasswordEncoder().encode(newPassword));
            userRepository.save(user);
            reset.setIsUsed(true);
            passwordResetRepository.save(reset);
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi cập nhật mật khẩu: " + e.getMessage());
        }
    }
}