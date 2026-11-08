package com.gosafe.gosafe_backend.comment.dto;

import com.gosafe.gosafe_backend.review.dto.ReviewDto;
import com.gosafe.gosafe_backend.user.dto.AuthorDto;

import java.time.Instant;
import java.util.UUID;

public record CommentDto(
        UUID id,
        UUID noticeId,
        String body,
        AuthorDto author,
        boolean initial,
        Instant createdAt,
        Instant editedAt,
        ReviewDto review
) {
}
