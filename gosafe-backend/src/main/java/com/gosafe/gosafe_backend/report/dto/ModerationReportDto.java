package com.gosafe.gosafe_backend.report.dto;

import com.gosafe.gosafe_backend.report.ReportOrigin;
import com.gosafe.gosafe_backend.report.ReportStatus;
import com.gosafe.gosafe_backend.report.ReportTarget;

import java.time.Instant;
import java.util.UUID;

/**
 * Denúncia vista pela moderação. RNF08: traz a autora real do conteúdo, mesmo
 * anônimo; por isso só as rotas /admin devolvem este formato.
 */
public record ModerationReportDto(
        UUID id,
        ReportTarget targetType,
        UUID targetId,
        TargetAuthorDto targetAuthor,
        String reason,
        ReportStatus status,
        ReportOrigin origin,
        Instant createdAt,
        Instant resolvedAt
) {

    public record TargetAuthorDto(UUID id, String name, String username) {
    }
}
