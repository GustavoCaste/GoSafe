package com.gosafe.gosafe_backend.notice.dto;

import com.gosafe.gosafe_backend.notice.NoticeType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateNoticeRequest(
        @NotBlank(message = "Título é obrigatório")
        @Size(min = 5, max = 120, message = "Título deve ter entre 5 e 120 caracteres")
        String title,

        @NotNull(message = "Tipo do aviso é obrigatório")
        NoticeType type
) {
}
