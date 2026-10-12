package com.gosafe.gosafe_backend.comment;

import com.gosafe.gosafe_backend.common.ContentStatus;
import com.gosafe.gosafe_backend.notice.Notice;
import com.gosafe.gosafe_backend.user.User;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "comments")
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "notice_id", nullable = false)
    private Notice notice;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(nullable = false, length = 1000)
    private String body;

    @Column(name = "is_initial", nullable = false)
    private Boolean initial = false;

    @Column(nullable = false)
    private Boolean anonymous = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ContentStatus status = ContentStatus.ACTIVE;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "edited_at")
    private Instant editedAt;

    public Comment() {
    }

    @PrePersist
    public void prePersist() {
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public Notice getNotice() {
        return notice;
    }

    public void setNotice(Notice notice) {
        this.notice = notice;
    }

    public User getAuthor() {
        return author;
    }

    public void setAuthor(User author) {
        this.author = author;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public Boolean getInitial() {
        return initial;
    }

    public void setInitial(Boolean initial) {
        this.initial = initial;
    }

    public Boolean getAnonymous() {
        return anonymous;
    }

    public void setAnonymous(Boolean anonymous) {
        this.anonymous = anonymous;
    }

    public ContentStatus getStatus() {
        return status;
    }

    public void setStatus(ContentStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getEditedAt() {
        return editedAt;
    }

    public void setEditedAt(Instant editedAt) {
        this.editedAt = editedAt;
    }
}
