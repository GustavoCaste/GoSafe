package com.gosafe.gosafe_backend.notice.dto;

import com.gosafe.gosafe_backend.notice.NoticeType;
import com.gosafe.gosafe_backend.review.dto.ReviewRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateNoticeRequest(
        @NotBlank(message = "Título é obrigatório")
        @Size(min = 5, max = 120, message = "Título deve ter entre 5 e 120 caracteres")
        String title,

        @NotNull(message = "Tipo do aviso é obrigatório")
        NoticeType type,

        @NotBlank(message = "Comentário inicial é obrigatório")
        @Size(max = 1000, message = "Comentário deve ter no máximo 1000 caracteres")
        String body,

        Boolean anonymous,

        @Valid
        ReviewRequest review
) {
}
