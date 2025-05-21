package entity;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;

@Entity
@Table(name = "tblReaction", schema = "dbo")
public class Reaction {
    @EmbeddedId
    private ReactionId id;

    @ColumnDefault("getdate()")
    @Column(name = "created_at")
    private Instant createdAt;

    public ReactionId getId() {
        return id;
    }

    public void setId(ReactionId id) {
        this.id = id;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

}