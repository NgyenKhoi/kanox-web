package entity;

import jakarta.persistence.*;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;

@Entity
@Table(name = "tblAccountUpgrade", schema = "dbo")
public class AccountUpgrade {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;

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