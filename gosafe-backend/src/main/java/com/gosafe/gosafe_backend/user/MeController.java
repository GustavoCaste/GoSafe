package com.gosafe.gosafe_backend.user;

import com.gosafe.gosafe_backend.security.AuthUser;
import com.gosafe.gosafe_backend.user.dto.ChangePasswordRequest;
import com.gosafe.gosafe_backend.user.dto.UpdateProfileRequest;
import com.gosafe.gosafe_backend.user.dto.UserDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/me")
public class MeController {

    private final UserService userService;

    public MeController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public UserDto me(@AuthenticationPrincipal AuthUser authUser) {
        return userService.me(authUser.id());
    }

    @PutMapping
    public UserDto update(
            @AuthenticationPrincipal AuthUser authUser,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        return userService.updateProfile(authUser.id(), request);
    }

    @PutMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(
            @AuthenticationPrincipal AuthUser authUser,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        userService.changePassword(authUser.id(), request);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@AuthenticationPrincipal AuthUser authUser) {
        userService.deactivate(authUser.id());
    }
}
