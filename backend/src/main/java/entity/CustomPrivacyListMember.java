package entity;

import jakarta.persistence.*;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;

@Entity
@Table(name = "tblCustomPrivacyListMembers", schema = "dbo")
public class CustomPrivacyListMember {
    @EmbeddedId
    private CustomPrivacyListMemberId id;

    @MapsId("listId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "list_id", nullable = false)
    private CustomPrivacyList list;

    @MapsId("memberUserId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_user_id", nullable = false)
    private User memberUser;

    @ColumnDefault("getdate()")
    @Column(name = "added_at")
    private Instant addedAt;

    @ColumnDefault("1")
    @Column(name = "status")
    private Boolean status;

    public CustomPrivacyListMemberId getId() {
        return id;
    }

    public void setId(CustomPrivacyListMemberId id) {
        this.id = id;
    }

    public CustomPrivacyList getList() {
        return list;
    }

    public void setList(CustomPrivacyList list) {
        this.list = list;
    }

    public User getMemberUser() {
        return memberUser;
    }

    public void setMemberUser(User memberUser) {
        this.memberUser = memberUser;
    }

    public Instant getAddedAt() {
        return addedAt;
    }

    public void setAddedAt(Instant addedAt) {
        this.addedAt = addedAt;
    }

    public Boolean getStatus() {
        return status;
    }

    public void setStatus(Boolean status) {
        this.status = status;
    }

}