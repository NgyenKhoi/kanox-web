package com.example.social_media.config;
import com.example.social_media.entity.User;
import com.example.social_media.entity.VerifiedEmail;
import com.example.social_media.repository.UserRepository;
import com.example.social_media.repository.VerifiedEmailRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Component
public class VerifiedEmailDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final VerifiedEmailRepository verifiedEmailRepository;

    public VerifiedEmailDataInitializer(UserRepository userRepository,
                                        VerifiedEmailRepository verifiedEmailRepository) {
        this.userRepository = userRepository;
        this.verifiedEmailRepository = verifiedEmailRepository;
    }

    @Override
    public void run(String... args) {
        List<User> allUsers = userRepository.findAll();
        for (User user : allUsers) {
            if (!verifiedEmailRepository.existsByUserIdAndEmail(user.getId(), user.getEmail())) {
                VerifiedEmail ve = new VerifiedEmail();
                ve.setUser(user);
                ve.setEmail(user.getEmail());
                ve.setVerified(true);
                ve.setVerificationCode("legacy-" + UUID.randomUUID().toString().substring(0, 8));
                ve.setCreatedAt(Instant.now());
                verifiedEmailRepository.save(ve);
                System.out.println("Created VerifiedEmail for user: " + user.getEmail());
            }
        }
    }
}