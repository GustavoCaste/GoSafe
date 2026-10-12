package com.gosafe.gosafe_backend.report;

import com.gosafe.gosafe_backend.common.PageResponse;
import com.gosafe.gosafe_backend.report.dto.CreateReportRequest;
import com.gosafe.gosafe_backend.report.dto.ReportDto;
import com.gosafe.gosafe_backend.report.dto.ResolveReportRequest;
import com.gosafe.gosafe_backend.security.AuthUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @PostMapping("/reports")
    @ResponseStatus(HttpStatus.CREATED)
    public ReportDto create(
            @Valid @RequestBody CreateReportRequest request,
            @AuthenticationPrincipal AuthUser authUser
    ) {
        return reportService.create(request, authUser);
    }

    @GetMapping("/admin/reports")
    public PageResponse<ReportDto> list(
            @RequestParam(defaultValue = "PENDING") ReportStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return reportService.list(status, page, size);
    }

    @PatchMapping("/admin/reports/{id}")
    public ReportDto resolve(
            @PathVariable UUID id,
            @Valid @RequestBody ResolveReportRequest request,
            @AuthenticationPrincipal AuthUser authUser
    ) {
        return reportService.resolve(id, request.upheld(), authUser);
    }
}
