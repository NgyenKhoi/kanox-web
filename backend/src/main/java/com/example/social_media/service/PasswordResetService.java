package com.example.social_media.service;

import com.example.social_media.entity.PasswordReset;
import com.example.social_media.entity.User;
import com.example.social_media.repository.PasswordResetRepository;
import com.example.social_media.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class PasswordResetService {

    @Autowired
    private PasswordResetRepository passwordResetRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JavaMailSender mailSender;

    public void sendResetToken(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Email không tồn tại"));

        PasswordReset reset = new PasswordReset();
        reset.setUser(user);
        reset.setToken(UUID.randomUUID().toString());
        reset.setTokenExpireTime(Instant.now().plusSeconds(3600)); // 1 giờ
        reset.setIsUsed(false);
        reset.setStatus(true);

        passwordResetRepository.save(reset);

        sendEmail(email, reset.getToken());
    }

    private void sendEmail(String toEmail, String token) {
        String resetLink = "http://localhost:3000/reset-password?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Yêu cầu đặt lại mật khẩu");
        message.setText("Bấm vào liên kết sau để đặt lại mật khẩu:\n" + resetLink);

        mailSender.send(message);
    }

    public void resetPassword(String token, String newPassword) {
        PasswordReset reset = passwordResetRepository.findByTokenAndStatusIsTrueAndIsUsedIsFalse(token)
                .orElseThrow(() -> new IllegalArgumentException("Token không hợp lệ hoặc đã sử dụng"));

        if (reset.getTokenExpireTime().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Token đã hết hạn");
        }

        User user = reset.getUser();
        user.setPassword(new BCryptPasswordEncoder().encode(newPassword));
        userRepository.save(user);

        reset.setIsUsed(true);
        passwordResetRepository.save(reset);
    }
}
