package com.gosafe.gosafe_backend.verification;

import com.gosafe.gosafe_backend.user.User;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Resultado de uma verificação facial. Nenhuma imagem é armazenada: apenas
 * o resultado, o provedor e as datas (LGPD art. 11).
 */
@Entity
@Table(name = "face_verifications")
public class FaceVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 30)
    private String provider;

    @Column(name = "liveness_ok", nullable = false)
    private Boolean livenessOk;

    @Column(name = "facematch_score", nullable = false)
    private Double facematchScore;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private VerificationStatus status;

    @Column(name = "consent_at", nullable = false)
    private Instant consentAt;

    @Column(name = "validated_at", nullable = false)
    private Instant validatedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public FaceVerification() {
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

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public Boolean getLivenessOk() {
        return livenessOk;
    }

    public void setLivenessOk(Boolean livenessOk) {
        this.livenessOk = livenessOk;
    }

    public Double getFacematchScore() {
        return facematchScore;
    }

    public void setFacematchScore(Double facematchScore) {
        this.facematchScore = facematchScore;
    }

    public VerificationStatus getStatus() {
        return status;
    }

    public void setStatus(VerificationStatus status) {
        this.status = status;
    }

    public Instant getConsentAt() {
        return consentAt;
    }

    public void setConsentAt(Instant consentAt) {
        this.consentAt = consentAt;
    }

    public Instant getValidatedAt() {
        return validatedAt;
    }

    public void setValidatedAt(Instant validatedAt) {
        this.validatedAt = validatedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
