package com.gosafe.gosafe_backend.place;

import com.gosafe.gosafe_backend.place.dto.PlaceDto;
import org.springframework.http.HttpStatus;
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

    @GetMapping
    public List<PlaceDto> findAll() {
        return placeService.findAll();
    }

    @GetMapping("/{id}")
    public PlaceDto findById(@PathVariable UUID id) {
        return placeService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PlaceDto create(@RequestBody PlaceDto dto) {
        return placeService.create(dto);
    }

    @PutMapping("/{id}")
    public PlaceDto update(
            @PathVariable UUID id,
            @RequestBody PlaceDto dto
    ) {
        return placeService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        placeService.delete(id);
    }
}
