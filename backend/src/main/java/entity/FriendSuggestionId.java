package entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.NotNull;
import org.hibernate.Hibernate;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class FriendSuggestionId implements Serializable {
    private static final long serialVersionUID = 1096650549350947040L;
    @NotNull
    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @NotNull
    @Column(name = "suggested_user_id", nullable = false)
    private Integer suggestedUserId;

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public Integer getSuggestedUserId() {
        return suggestedUserId;
    }

    public void setSuggestedUserId(Integer suggestedUserId) {
        this.suggestedUserId = suggestedUserId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || Hibernate.getClass(this) != Hibernate.getClass(o)) return false;
        FriendSuggestionId entity = (FriendSuggestionId) o;
        return Objects.equals(this.suggestedUserId, entity.suggestedUserId) &&
                Objects.equals(this.userId, entity.userId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(suggestedUserId, userId);
    }

}