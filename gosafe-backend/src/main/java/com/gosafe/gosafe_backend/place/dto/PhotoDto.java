package com.gosafe.gosafe_backend.place.dto;

import java.time.Instant;
import java.util.UUID;

public record PhotoDto(UUID id, String url, int position, Instant createdAt) {
}
