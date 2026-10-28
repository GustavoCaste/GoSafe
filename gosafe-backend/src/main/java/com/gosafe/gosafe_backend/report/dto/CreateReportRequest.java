package com.gosafe.gosafe_backend.report.dto;

import com.gosafe.gosafe_backend.report.ReportTarget;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateReportRequest(
        @NotNull(message = "Tipo do conteúdo é obrigatório")
        ReportTarget targetType,

        @NotNull(message = "Conteúdo denunciado é obrigatório")
        UUID targetId,

        @NotBlank(message = "Motivo é obrigatório")
        @Size(max = 500, message = "Motivo deve ter no máximo 500 caracteres")
        String reason
) {
}
