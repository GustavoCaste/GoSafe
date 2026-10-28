package com.gosafe.gosafe_backend.report.dto;

import jakarta.validation.constraints.NotNull;

public record ResolveReportRequest(
        @NotNull(message = "Informe se a denúncia é procedente")
        Boolean upheld
) {
}
