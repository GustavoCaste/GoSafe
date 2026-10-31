package com.gosafe.gosafe_backend.notice.dto;

import com.gosafe.gosafe_backend.comment.dto.CommentDto;

public record NoticeDetailDto(
        NoticeDto notice,
        String placeName,
        CommentDto initialComment
) {
}
