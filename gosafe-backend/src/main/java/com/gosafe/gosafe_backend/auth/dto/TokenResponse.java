package com.gosafe.gosafe_backend.auth.dto;

import com.gosafe.gosafe_backend.user.dto.UserDto;

import java.time.Instant;

public record TokenResponse(
        String token,
        String tokenType,
        Instant expiresAt,
        UserDto user
) {
}
