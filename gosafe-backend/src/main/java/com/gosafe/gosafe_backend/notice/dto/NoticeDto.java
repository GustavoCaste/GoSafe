package com.gosafe.gosafe_backend.notice.dto;

import com.gosafe.gosafe_backend.notice.NoticeType;
import com.gosafe.gosafe_backend.user.dto.AuthorDto;

import java.time.Instant;
import java.util.UUID;

public record NoticeDto(
        UUID id,
        UUID placeId,
        String title,
        NoticeType type,
        AuthorDto author,
        int commentCount,
        Instant createdAt,
        Instant lastActivityAt
) {
}
