package com.gosafe.gosafe_backend.review;

import com.gosafe.gosafe_backend.checkin.CheckIn;
import com.gosafe.gosafe_backend.comment.Comment;
import com.gosafe.gosafe_backend.place.Place;
import com.gosafe.gosafe_backend.user.User;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Avaliação ligada a um comentário. Cinco parâmetros de 1 a 5; banheiro pode
 * ser nulo ("não há") e fica fora da média. O peso aplicado é congelado no
 * momento do voto.
 */
@Entity
@Table(name = "reviews")
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "place_id", nullable = false)
    private Place place;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "comment_id", nullable = false, unique = true)
    private Comment comment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "check_in_id")
    private CheckIn checkIn;

    @Column(nullable = false)
    private Integer safety;

    @Column(nullable = false)
    private Integer lighting;

    @Column(nullable = false)
    private Integer movement;

    @Column(nullable = false)
    private Integer welcoming;

    private Integer restroom;

    @Column(nullable = false)
    private Double score;

    @Column(name = "applied_weight", nullable = false)
    private Double appliedWeight;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public Review() {
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

    public void setUser(User user) {
        this.user = user;
    }

    public Place getPlace() {
        return place;
    }

    public void setPlace(Place place) {
        this.place = place;
    }

    public Comment getComment() {
        return comment;
    }

    public void setComment(Comment comment) {
        this.comment = comment;
    }

    public CheckIn getCheckIn() {
        return checkIn;
    }

    public void setCheckIn(CheckIn checkIn) {
        this.checkIn = checkIn;
    }

    public Integer getSafety() {
        return safety;
    }

    public void setSafety(Integer safety) {
        this.safety = safety;
    }

    public Integer getLighting() {
        return lighting;
    }

    public void setLighting(Integer lighting) {
        this.lighting = lighting;
    }

    public Integer getMovement() {
        return movement;
    }

    public void setMovement(Integer movement) {
        this.movement = movement;
    }

    public Integer getWelcoming() {
        return welcoming;
    }

    public void setWelcoming(Integer welcoming) {
        this.welcoming = welcoming;
    }

    public Integer getRestroom() {
        return restroom;
    }

    public void setRestroom(Integer restroom) {
        this.restroom = restroom;
    }

    public Double getScore() {
        return score;
    }

    public void setScore(Double score) {
        this.score = score;
    }

    public Double getAppliedWeight() {
        return appliedWeight;
    }

    public void setAppliedWeight(Double appliedWeight) {
        this.appliedWeight = appliedWeight;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
