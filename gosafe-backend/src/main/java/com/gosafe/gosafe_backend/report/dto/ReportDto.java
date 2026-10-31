package com.gosafe.gosafe_backend.report.dto;

import com.gosafe.gosafe_backend.report.ReportOrigin;
import com.gosafe.gosafe_backend.report.ReportStatus;
import com.gosafe.gosafe_backend.report.ReportTarget;

import java.time.Instant;
import java.util.UUID;

public record ReportDto(
        UUID id,
        ReportTarget targetType,
        UUID targetId,
        String reason,
        ReportStatus status,
        ReportOrigin origin,
        Instant createdAt,
        Instant resolvedAt
) {
}
