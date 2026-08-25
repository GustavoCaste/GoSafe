package com.gosafe.gosafe_backend.review;

import com.gosafe.gosafe_backend.review.dto.ReviewDto;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping
    public List<ReviewDto> findAll() {
        return reviewService.findAll();
    }

    @GetMapping("/{id}")
    public ReviewDto findById(@PathVariable UUID id) {
        return reviewService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewDto create(@RequestBody ReviewDto dto) {
        return reviewService.create(dto);
    }

    @PutMapping("/{id}")
    public ReviewDto update(
            @PathVariable UUID id,
            @RequestBody ReviewDto dto
    ) {
        return reviewService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        reviewService.delete(id);
    }
}
