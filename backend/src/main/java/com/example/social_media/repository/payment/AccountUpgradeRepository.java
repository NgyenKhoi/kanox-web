package com.example.social_media.repository.payment;

import com.example.social_media.entity.AccountUpgrade;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccountUpgradeRepository extends JpaRepository<AccountUpgrade, Long> {
    boolean existsAccountUpgradeByUser_Id(Integer userId);
}
