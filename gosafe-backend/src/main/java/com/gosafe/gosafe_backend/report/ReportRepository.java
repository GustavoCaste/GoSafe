package com.gosafe.gosafe_backend.report;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ReportRepository extends JpaRepository<Report, UUID> {

    long countByTargetAuthor_IdAndStatus(UUID targetAuthorId, ReportStatus status);

    boolean existsByReporter_IdAndTargetTypeAndTargetIdAndStatus(
            UUID reporterId,
            ReportTarget targetType,
            UUID targetId,
            ReportStatus status
    );

    Page<Report> findByStatusOrderByCreatedAtAsc(ReportStatus status, Pageable pageable);
}
