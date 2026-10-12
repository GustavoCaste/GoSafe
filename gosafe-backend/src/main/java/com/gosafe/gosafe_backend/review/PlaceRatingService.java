package com.gosafe.gosafe_backend.review;

import com.gosafe.gosafe_backend.common.ContentStatus;
import com.gosafe.gosafe_backend.place.Place;
import com.gosafe.gosafe_backend.place.dto.PlaceStatsDto;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

/**
 * RN07: nota do local = média ponderada pelo peso de cada voto, considerando
 * só a avaliação mais recente de cada usuária.
 */
@Service
public class PlaceRatingService {

    private final ReviewRepository reviewRepository;

    public PlaceRatingService(ReviewRepository reviewRepository) {
        this.reviewRepository = reviewRepository;
    }

    public PlaceStatsDto stats(UUID placeId) {
        Map<UUID, Review> latestByUser = new LinkedHashMap<>();

        for (Review review : reviewRepository.findVisibleByPlace(placeId, ContentStatus.ACTIVE)) {
            latestByUser.putIfAbsent(review.getUser().getId(), review);
        }

        Collection<Review> reviews = latestByUser.values();

        return new PlaceStatsDto(
                weightedAverage(reviews, Review::getScore),
                reviews.size(),
                weightedAverage(reviews, review -> toDouble(review.getSafety())),
                weightedAverage(reviews, review -> toDouble(review.getLighting())),
                weightedAverage(reviews, review -> toDouble(review.getMovement())),
                weightedAverage(reviews, review -> toDouble(review.getWelcoming())),
                weightedAverage(reviews, review -> toDouble(review.getRestroom()))
        );
    }

    public void recalculate(Place place) {
        PlaceStatsDto stats = stats(place.getId());

        place.setWeightedRating(stats.rating());
        place.setRatingCount(stats.ratingCount());
    }

    static Double weightedAverage(Collection<Review> reviews, Function<Review, Double> value) {
        double sum = 0;
        double weights = 0;

        for (Review review : reviews) {
            Double v = value.apply(review);
            if (v != null) {
                sum += v * review.getAppliedWeight();
                weights += review.getAppliedWeight();
            }
        }

        return weights == 0 ? null : Math.round(sum / weights * 100.0) / 100.0;
    }

    private static Double toDouble(Integer value) {
        return value == null ? null : value.doubleValue();
    }
}
