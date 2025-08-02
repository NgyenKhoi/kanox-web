package com.example.social_media.service;

import com.example.social_media.dto.payment.ConfirmPremiumRequest;
import com.example.social_media.entity.AccountUpgrade;
import com.example.social_media.entity.UpgradeType;
import com.example.social_media.entity.User;
import com.example.social_media.repository.payment.AccountUpgradeRepository;
import com.example.social_media.repository.payment.UpgradeTypeRepository;
import com.example.social_media.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final AccountUpgradeRepository accountUpgradeRepository;
    private final UpgradeTypeRepository upgradeTypeRepository;
    private final UserRepository userRepository;

    public void confirmPremium(Integer userId, ConfirmPremiumRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UpgradeType premiumType = upgradeTypeRepository.findById(1) // Giả sử ID 1 là Premium
                .orElseThrow(() -> new RuntimeException("Upgrade type not found"));

        AccountUpgrade upgrade = new AccountUpgrade();
        upgrade.setUser(user);
        upgrade.setUpgradeType(premiumType);
        upgrade.setUpgradeAt(Instant.now());
        upgrade.setExpireTime(Instant.now().plus(30, ChronoUnit.DAYS)); // +30 ngày
        upgrade.setStatus(true);

        accountUpgradeRepository.save(upgrade);
    }

    public boolean isPremium(Integer userId) {
        return accountUpgradeRepository.existsAccountUpgradeByUser_Id(userId);
    }
}
