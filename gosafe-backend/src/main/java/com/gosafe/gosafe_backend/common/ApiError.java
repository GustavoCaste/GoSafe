package com.gosafe.gosafe_backend.common;

import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.Map;

public record ApiError(
        int status,
        String error,
        String message,
        Map<String, String> fields,
        Instant timestamp
) {

    public static ApiError of(int status, String message, Map<String, String> fields) {
        HttpStatus httpStatus = HttpStatus.resolve(status);
        String error = httpStatus != null ? httpStatus.getReasonPhrase() : String.valueOf(status);
        return new ApiError(status, error, message, fields, Instant.now());
    }
}
