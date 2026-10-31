package com.gosafe.gosafe_backend.verification;

import com.gosafe.gosafe_backend.security.AuthUser;
import com.gosafe.gosafe_backend.verification.dto.VerificationDto;
import com.gosafe.gosafe_backend.verification.dto.VerificationRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/me/verification")
public class VerificationController {

    private final VerificationService verificationService;

    public VerificationController(VerificationService verificationService) {
        this.verificationService = verificationService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public VerificationDto verify(
            @AuthenticationPrincipal AuthUser authUser,
            @Valid @RequestBody VerificationRequest request
    ) {
        return verificationService.verify(authUser.id());
    }

    @GetMapping
    public VerificationDto latest(@AuthenticationPrincipal AuthUser authUser) {
        return verificationService.latest(authUser.id());
    }
}
