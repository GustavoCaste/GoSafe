package com.gosafe.gosafe_backend.user.dto;

import com.gosafe.gosafe_backend.user.Role;
import com.gosafe.gosafe_backend.user.Sex;

import java.time.Instant;
import java.util.UUID;

public record UserDto(
        UUID id,
        String name,
        String username,
        String email,
        Sex sex,
        String photoUrl,
        boolean verified,
        Role role,
        int validContributions,
        double reputationWeight,
        Instant createdAt
) {
}
