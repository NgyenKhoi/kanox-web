package entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.NotNull;
import org.hibernate.Hibernate;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class CustomPrivacyListMemberId implements Serializable {
    private static final long serialVersionUID = 1379077660404867382L;
    @NotNull
    @Column(name = "list_id", nullable = false)
    private Integer listId;

    @NotNull
    @Column(name = "member_user_id", nullable = false)
    private Integer memberUserId;

    public Integer getListId() {
        return listId;
    }

    public void setListId(Integer listId) {
        this.listId = listId;
    }

    public Integer getMemberUserId() {
        return memberUserId;
    }

    public void setMemberUserId(Integer memberUserId) {
        this.memberUserId = memberUserId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || Hibernate.getClass(this) != Hibernate.getClass(o)) return false;
        CustomPrivacyListMemberId entity = (CustomPrivacyListMemberId) o;
        return Objects.equals(this.listId, entity.listId) &&
                Objects.equals(this.memberUserId, entity.memberUserId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(listId, memberUserId);
    }

}