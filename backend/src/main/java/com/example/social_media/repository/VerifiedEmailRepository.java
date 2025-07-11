package com.example.social_media.repository;

import com.example.social_media.entity.VerifiedEmail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.security.core.userdetails.User;

import java.util.Optional;

public interface VerifiedEmailRepository extends JpaRepository<VerifiedEmail, Integer> {
    Optional<VerifiedEmail> findByEmailAndVerificationCodeAndVerifiedFalse(String email, String verificationCode);
    Optional<VerifiedEmail> findByUserAndEmail(User user, String email);
    Optional<VerifiedEmail> findByVerificationCode(String verificationCode);
}