package com.gosafe.gosafe_backend.favorite;

import com.gosafe.gosafe_backend.place.dto.PlaceSummaryDto;
import com.gosafe.gosafe_backend.security.AuthUser;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class FavoriteController {

    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @GetMapping("/me/favorites")
    public List<PlaceSummaryDto> list(
            @AuthenticationPrincipal AuthUser authUser,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng
    ) {
        return favoriteService.list(authUser.id(), lat, lng);
    }

    @PutMapping("/places/{placeId}/favorite")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void add(@PathVariable UUID placeId, @AuthenticationPrincipal AuthUser authUser) {
        favoriteService.add(authUser.id(), placeId);
    }

    @DeleteMapping("/places/{placeId}/favorite")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@PathVariable UUID placeId, @AuthenticationPrincipal AuthUser authUser) {
        favoriteService.remove(authUser.id(), placeId);
    }
}
