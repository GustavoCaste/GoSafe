package com.gosafe.gosafe_backend.checkin;

import com.gosafe.gosafe_backend.checkin.dto.CheckInDto;
import com.gosafe.gosafe_backend.checkin.dto.CheckInRequest;
import com.gosafe.gosafe_backend.common.PageResponse;
import com.gosafe.gosafe_backend.security.AuthUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
public class CheckInController {

    private final CheckInService checkInService;

    public CheckInController(CheckInService checkInService) {
        this.checkInService = checkInService;
    }

    @PostMapping("/places/{placeId}/checkins")
    @ResponseStatus(HttpStatus.CREATED)
    public CheckInDto checkIn(
            @PathVariable UUID placeId,
            @Valid @RequestBody CheckInRequest request,
            @AuthenticationPrincipal AuthUser authUser
    ) {
        return checkInService.checkIn(placeId, request, authUser.id());
    }

    @GetMapping("/me/checkins")
    public PageResponse<CheckInDto> mine(
            @AuthenticationPrincipal AuthUser authUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return checkInService.mine(authUser.id(), page, size);
    }
}
