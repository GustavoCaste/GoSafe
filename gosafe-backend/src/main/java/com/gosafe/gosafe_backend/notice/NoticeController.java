package com.gosafe.gosafe_backend.notice;

import com.gosafe.gosafe_backend.common.PageResponse;
import com.gosafe.gosafe_backend.notice.dto.CreateNoticeRequest;
import com.gosafe.gosafe_backend.notice.dto.NoticeDetailDto;
import com.gosafe.gosafe_backend.notice.dto.NoticeDto;
import com.gosafe.gosafe_backend.notice.dto.UpdateNoticeRequest;
import com.gosafe.gosafe_backend.security.AuthUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
public class NoticeController {

    private final NoticeService noticeService;

    public NoticeController(NoticeService noticeService) {
        this.noticeService = noticeService;
    }

    @GetMapping("/places/{placeId}/notices")
    public PageResponse<NoticeDto> list(
            @PathVariable UUID placeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal AuthUser viewer
    ) {
        return noticeService.list(placeId, page, size, viewer);
    }

    @PostMapping("/places/{placeId}/notices")
    @ResponseStatus(HttpStatus.CREATED)
    public NoticeDetailDto create(
            @PathVariable UUID placeId,
            @Valid @RequestBody CreateNoticeRequest request,
            @AuthenticationPrincipal AuthUser authUser
    ) {
        return noticeService.create(placeId, request, authUser);
    }

    @GetMapping("/notices/{id}")
    public NoticeDetailDto detail(@PathVariable UUID id, @AuthenticationPrincipal AuthUser viewer) {
        return noticeService.detail(id, viewer);
    }

    @PutMapping("/notices/{id}")
    public NoticeDetailDto update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateNoticeRequest request,
            @AuthenticationPrincipal AuthUser authUser
    ) {
        return noticeService.update(id, request, authUser);
    }

    @DeleteMapping("/notices/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, @AuthenticationPrincipal AuthUser authUser) {
        noticeService.delete(id, authUser);
    }
}
