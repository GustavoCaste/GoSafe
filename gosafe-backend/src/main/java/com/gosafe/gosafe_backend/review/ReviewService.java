package com.gosafe.gosafe_backend.review;

import com.gosafe.gosafe_backend.checkin.CheckIn;
import com.gosafe.gosafe_backend.checkin.CheckInService;
import com.gosafe.gosafe_backend.comment.Comment;
import com.gosafe.gosafe_backend.place.Place;
import com.gosafe.gosafe_backend.reputation.ReputationFormula;
import com.gosafe.gosafe_backend.reputation.ReputationService;
import com.gosafe.gosafe_backend.review.dto.ReviewDto;
import com.gosafe.gosafe_backend.review.dto.ReviewRequest;
import com.gosafe.gosafe_backend.user.User;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final CheckInService checkInService;
    private final ReputationService reputationService;
    private final PlaceRatingService placeRatingService;

    public ReviewService(
            ReviewRepository reviewRepository,
            CheckInService checkInService,
            ReputationService reputationService,
            PlaceRatingService placeRatingService
    ) {
        this.reviewRepository = reviewRepository;
        this.checkInService = checkInService;
        this.reputationService = reputationService;
        this.placeRatingService = placeRatingService;
    }

    /** Cria a avaliação de um comentário e recalcula a nota do local. */
    public Review create(User user, Place place, Comment comment, ReviewRequest request) {
        CheckIn checkIn = checkInService.findValidRecent(user.getId(), place.getId()).orElse(null);

        Review review = new Review();

        review.setUser(user);
        review.setPlace(place);
        review.setComment(comment);
        review.setCheckIn(checkIn);
        review.setSafety(request.safety());
        review.setLighting(request.lighting());
        review.setMovement(request.movement());
        review.setWelcoming(request.welcoming());
        review.setRestroom(request.restroom());
        review.setScore(ReputationFormula.averageScore(
                request.safety(),
                request.lighting(),
                request.movement(),
                request.welcoming(),
                request.restroom()
        ));
        review.setAppliedWeight(reputationService.voteWeight(user, checkIn != null));

        Review saved = reviewRepository.saveAndFlush(review);
        placeRatingService.recalculate(place);
        return saved;
    }

    public Map<UUID, Review> byCommentIds(Collection<UUID> commentIds) {
        if (commentIds.isEmpty()) {
            return Map.of();
        }

        return reviewRepository.findByComment_IdIn(commentIds)
                .stream()
                .collect(Collectors.toMap(review -> review.getComment().getId(), Function.identity()));
    }

    public static ReviewDto toDto(Review review) {
        if (review == null) {
            return null;
        }

        return new ReviewDto(
                review.getSafety(),
                review.getLighting(),
                review.getMovement(),
                review.getWelcoming(),
                review.getRestroom(),
                review.getScore(),
                review.getCheckIn() != null
        );
    }
}
