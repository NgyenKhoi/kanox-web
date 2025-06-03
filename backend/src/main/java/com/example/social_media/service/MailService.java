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
import java.util.UUID;

@Service
public class MailService {

    private final PasswordResetRepository passwordResetRepository;
    private final UserRepository userRepository;
    private final JavaMailSender mailSender;

    public MailService(PasswordResetRepository passwordResetRepository, UserRepository userRepository, JavaMailSender mailSender) {
        this.passwordResetRepository = passwordResetRepository;
        this.userRepository = userRepository;
        this.mailSender = mailSender;
    }

    public void sendResetToken(String email) {
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
    //send temporary password when regis by google, user can change it here
    public void sendTemporaryPasswordEmail(String toEmail, String temporaryPassword) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Welcome! Your Temporary Password");
        message.setText("Hello,\n\nYour account has been created via Google Login.\n" +
                "Here is your temporary password: " + temporaryPassword +
                "\n\nPlease log in and change your password in the settings section.\n\nBest regards!");

        mailSender.send(message);
    }

    public void sendVerificationEmail(String recipientEmail, String verificationLink) {
        String subject = "Please verify your email address";
        String content = "Dear user,\n\n"
                + "Thank you for registering. Please click the link below to verify your email address:\n"
                + verificationLink + "\n\n"
                + "This link will expire in 24 hours.\n\n"
                + "Best regards,\n"
                + "Social Media App Team";

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(recipientEmail);
        message.setSubject(subject);
        message.setText(content);

        mailSender.send(message);
    }
}