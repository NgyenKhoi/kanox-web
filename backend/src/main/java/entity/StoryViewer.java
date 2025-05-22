package entity;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;

@Entity
@Table(name = "tblStoryViewer", schema = "dbo")
public class StoryViewer {
    @EmbeddedId
    private StoryViewerId id;

    @ColumnDefault("getdate()")
    @Column(name = "view_time")
    private Instant viewTime;

    @ColumnDefault("1")
    @Column(name = "status")
    private Boolean status;

    public StoryViewerId getId() {
        return id;
    }

    public void setId(StoryViewerId id) {
        this.id = id;
    }

    public Instant getViewTime() {
        return viewTime;
    }

    public void setViewTime(Instant viewTime) {
        this.viewTime = viewTime;
    }

    public Boolean getStatus() {
        return status;
    }

    public void setStatus(Boolean status) {
        this.status = status;
    }

}