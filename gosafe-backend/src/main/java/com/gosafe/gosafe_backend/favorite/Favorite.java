package com.gosafe.gosafe_backend.favorite;

import com.gosafe.gosafe_backend.place.Place;
import com.gosafe.gosafe_backend.user.User;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "favorites",
        uniqueConstraints = @UniqueConstraint(name = "uk_favorites_user_place", columnNames = {"user_id", "place_id"})
)
public class Favorite {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "place_id", nullable = false)
    private Place place;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public Favorite() {
    }

    public Favorite(User user, Place place) {
        this.user = user;
        this.place = place;
    }

    @PrePersist
    public void prePersist() {
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public Place getPlace() {
        return place;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
