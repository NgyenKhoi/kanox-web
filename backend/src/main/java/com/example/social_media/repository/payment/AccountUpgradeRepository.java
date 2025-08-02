package com.example.social_media.repository.payment;

import com.example.social_media.entity.AccountUpgrade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Set;

public interface AccountUpgradeRepository extends JpaRepository<AccountUpgrade, Long> {
    boolean existsAccountUpgradeByUser_Id(Integer userId);

    @Query("SELECT DISTINCT a.user.id " +
            "FROM AccountUpgrade a " +
            "WHERE a.status = true AND a.expireTime > CURRENT_TIMESTAMP")
    Set<Integer> findActivePremiumUserIds();
}
