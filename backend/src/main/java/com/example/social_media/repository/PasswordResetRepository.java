package com.example.social_media.repository;

import com.example.social_media.entity.PasswordReset;
import com.example.social_media.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PasswordResetRepository extends JpaRepository<PasswordReset, Integer> {
    Optional<PasswordReset> findByTokenAndStatusTrue(String token);
    Optional<PasswordReset> findByUserAndStatusTrue(User user);
}
