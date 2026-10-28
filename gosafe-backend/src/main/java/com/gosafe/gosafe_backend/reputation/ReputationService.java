package com.gosafe.gosafe_backend.reputation;

import com.gosafe.gosafe_backend.report.ReportRepository;
import com.gosafe.gosafe_backend.report.ReportStatus;
import com.gosafe.gosafe_backend.user.User;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;

@Service
public class ReputationService {

    private final ReportRepository reportRepository;

    public ReputationService(ReportRepository reportRepository) {
        this.reportRepository = reportRepository;
    }

    public double profileWeight(User user) {
        Instant createdAt = user.getCreatedAt() != null ? user.getCreatedAt() : Instant.now();
        long ageDays = Duration.between(createdAt, Instant.now()).toDays();
        long upheld = user.getId() == null
                ? 0
                : reportRepository.countByTargetAuthor_IdAndStatus(user.getId(), ReportStatus.UPHELD);

        return ReputationFormula.profileWeight(
                ageDays,
                user.getValidContributions(),
                Boolean.TRUE.equals(user.getVerified()),
                upheld
        );
    }

    public double voteWeight(User user, boolean withCheckIn) {
        return ReputationFormula.voteWeight(profileWeight(user), withCheckIn);
    }

    public void contributionAdded(User user) {
        user.setValidContributions(user.getValidContributions() + 1);
    }

    public void contributionRemoved(User user) {
        user.setValidContributions(Math.max(0, user.getValidContributions() - 1));
    }
}
