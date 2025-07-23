package com.example.social_media.repository;

import com.example.social_media.entity.VerifiedEmail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.security.core.userdetails.User;

import java.util.Optional;

public interface VerifiedEmailRepository extends JpaRepository<VerifiedEmail, Integer> {
    Optional<VerifiedEmail> findByVerificationCode(String verificationCode);
    Optional<VerifiedEmail> findByEmailAndVerifiedTrue(String email);
    boolean existsByUserIdAndEmail(Integer userId, String email);
}