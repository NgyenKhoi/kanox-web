package entity;

import jakarta.persistence.*;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;

@Entity
@Table(name = "tblChatMember", schema = "dbo")
public class ChatMember {
    @EmbeddedId
    private ChatMemberId id;

    @MapsId("chatId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "chat_id", nullable = false)
    private Chat chat;

    @MapsId("userId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ColumnDefault("getdate()")
    @Column(name = "joined_at")
    private Instant joinedAt;

    @ColumnDefault("0")
    @Column(name = "is_admin")
    private Boolean isAdmin;

    @ColumnDefault("0")
    @Column(name = "is_spam")
    private Boolean isSpam;

    @ColumnDefault("1")
    @Column(name = "status")
    private Boolean status;

    public ChatMemberId getId() {
        return id;
    }

    public void setId(ChatMemberId id) {
        this.id = id;
    }

    public Chat getChat() {
        return chat;
    }

    public void setChat(Chat chat) {
        this.chat = chat;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Instant getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(Instant joinedAt) {
        this.joinedAt = joinedAt;
    }

    public Boolean getIsAdmin() {
        return isAdmin;
    }

    public void setIsAdmin(Boolean isAdmin) {
        this.isAdmin = isAdmin;
    }

    public Boolean getIsSpam() {
        return isSpam;
    }

    public void setIsSpam(Boolean isSpam) {
        this.isSpam = isSpam;
    }

    public Boolean getStatus() {
        return status;
    }

    public void setStatus(Boolean status) {
        this.status = status;
    }

}