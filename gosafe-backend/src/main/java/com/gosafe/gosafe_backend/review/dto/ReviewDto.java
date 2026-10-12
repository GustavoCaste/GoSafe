package com.gosafe.gosafe_backend.review.dto;

public record ReviewDto(
        int safety,
        int lighting,
        int movement,
        int welcoming,
        Integer restroom,
        double score,
        boolean withCheckIn
) {
}
