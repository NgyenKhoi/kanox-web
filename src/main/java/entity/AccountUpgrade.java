package entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;

@Entity
@Table(name = "tblAccountUpgrade", schema = "dbo")
public class AccountUpgrade {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private entity.User user;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "upgrade_type_id", nullable = false)
    private entity.UpgradeType upgradeType;

    @ColumnDefault("getdate()")
    @Column(name = "upgrade_at")
    private Instant upgradeAt;

    @Column(name = "expire_time")
    private Instant expireTime;

    @ColumnDefault("1")
    @Column(name = "status")
    private Boolean status;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public entity.User getUser() {
        return user;
    }

    public void setUser(entity.User user) {
        this.user = user;
    }

    public entity.UpgradeType getUpgradeType() {
        return upgradeType;
    }

    public void setUpgradeType(entity.UpgradeType upgradeType) {
        this.upgradeType = upgradeType;
    }

    public Instant getUpgradeAt() {
        return upgradeAt;
    }

    public void setUpgradeAt(Instant upgradeAt) {
        this.upgradeAt = upgradeAt;
    }

    public Instant getExpireTime() {
        return expireTime;
    }

    public void setExpireTime(Instant expireTime) {
        this.expireTime = expireTime;
    }

    public Boolean getStatus() {
        return status;
    }

    public void setStatus(Boolean status) {
        this.status = status;
    }

}