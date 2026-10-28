package com.gosafe.gosafe_backend.place;

import com.gosafe.gosafe_backend.common.PageResponse;
import com.gosafe.gosafe_backend.place.dto.*;
import com.gosafe.gosafe_backend.security.AuthUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/places")
public class PlaceController {

    private final PlaceService placeService;

    public PlaceController(PlaceService placeService) {
        this.placeService = placeService;
    }

    /** Pins da área visível do mapa; o app chama de novo a cada arraste/zoom. */
    @GetMapping("/map")
    public List<PlacePinDto> map(
            @RequestParam double minLng,
            @RequestParam double minLat,
            @RequestParam double maxLng,
            @RequestParam double maxLat,
            @RequestParam(required = false) PlaceCategory category
    ) {
        return placeService.map(minLng, minLat, maxLng, maxLat, category);
    }

    @GetMapping
    public PageResponse<PlaceSummaryDto> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) PlaceCategory category,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) PlaceSort sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return placeService.search(q, category, district, city, lat, lng, sort, page, size);
    }

    @GetMapping("/{id}")
    public PlaceDetailDto detail(
            @PathVariable UUID id,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @AuthenticationPrincipal AuthUser viewer
    ) {
        return placeService.detail(id, lat, lng, viewer);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PlaceDetailDto create(
            @Valid @RequestBody PlaceRequest request,
            @AuthenticationPrincipal AuthUser authUser
    ) {
        return placeService.create(request, authUser);
    }

    @PutMapping("/{id}")
    public PlaceDetailDto update(
            @PathVariable UUID id,
            @Valid @RequestBody PlaceRequest request,
            @AuthenticationPrincipal AuthUser authUser
    ) {
        return placeService.update(id, request, authUser);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@PathVariable UUID id, @AuthenticationPrincipal AuthUser authUser) {
        placeService.deactivate(id, authUser);
    }

    @GetMapping("/{id}/photos")
    public List<PhotoDto> photos(@PathVariable UUID id) {
        return placeService.photos(id);
    }

    @PostMapping("/{id}/photos")
    @ResponseStatus(HttpStatus.CREATED)
    public PhotoDto addPhoto(
            @PathVariable UUID id,
            @Valid @RequestBody PhotoRequest request,
            @AuthenticationPrincipal AuthUser authUser
    ) {
        return placeService.addPhoto(id, request, authUser);
    }
}
