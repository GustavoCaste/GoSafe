package com.gosafe.gosafe_backend.checkin;

import com.gosafe.gosafe_backend.checkin.dto.CheckInDto;
import com.gosafe.gosafe_backend.checkin.dto.CheckInRequest;
import com.gosafe.gosafe_backend.common.Errors;
import com.gosafe.gosafe_backend.common.PageResponse;
import com.gosafe.gosafe_backend.common.Pages;
import com.gosafe.gosafe_backend.place.Place;
import com.gosafe.gosafe_backend.place.PlaceRepository;
import com.gosafe.gosafe_backend.user.User;
import com.gosafe.gosafe_backend.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * RN09/RN10: check-in válido a até {@code radius} metros do local, descontando
 * a precisão informada pelo GPS do aparelho; um por local a cada janela.
 */
@Service
public class CheckInService {

    private final CheckInRepository checkInRepository;
    private final PlaceRepository placeRepository;
    private final UserRepository userRepository;
    private final double radiusMeters;
    private final double maxAccuracyMeters;
    private final Duration window;

    public CheckInService(
            CheckInRepository checkInRepository,
            PlaceRepository placeRepository,
            UserRepository userRepository,
            @Value("${gosafe.checkin.radius-meters:100}") double radiusMeters,
            @Value("${gosafe.checkin.max-accuracy-meters:100}") double maxAccuracyMeters,
            @Value("${gosafe.checkin.window-hours:4}") long windowHours
    ) {
        this.checkInRepository = checkInRepository;
        this.placeRepository = placeRepository;
        this.userRepository = userRepository;
        this.radiusMeters = radiusMeters;
        this.maxAccuracyMeters = maxAccuracyMeters;
        this.window = Duration.ofHours(windowHours);
    }

    @Transactional
    public CheckInDto checkIn(UUID placeId, CheckInRequest request, UUID userId) {
        Place place = placeRepository.findById(placeId)
                .filter(Place::getActive)
                .orElseThrow(() -> Errors.notFound("Local não encontrado"));
        User user = userRepository.findById(userId)
                .filter(User::getActive)
                .orElseThrow(() -> Errors.notFound("Usuária não encontrada"));

        if (request.accuracyMeters() > maxAccuracyMeters) {
            throw Errors.unprocessable(String.format(
                    "Precisão do GPS insuficiente (%.0f m). Tente novamente em local aberto.",
                    request.accuracyMeters()
            ));
        }

        if (findValidRecent(userId, placeId).isPresent()) {
            throw Errors.conflict("Você já fez check-in neste local nas últimas " + window.toHours() + " horas");
        }

        Double distance = placeRepository.distanceMeters(placeId, request.latitude(), request.longitude());
        double effectiveDistance = Math.max(0, distance - request.accuracyMeters());

        if (effectiveDistance > radiusMeters) {
            throw Errors.unprocessable(String.format(
                    "Você está a %.0f m do local; o check-in exige até %.0f m",
                    distance,
                    radiusMeters
            ));
        }

        CheckIn checkIn = new CheckIn();

        checkIn.setUser(user);
        checkIn.setPlace(place);
        checkIn.setDistanceMeters((double) Math.round(distance));
        checkIn.setAccuracyMeters(request.accuracyMeters());
        checkIn.setValid(true);

        return toDto(checkInRepository.save(checkIn));
    }

    @Transactional(readOnly = true)
    public PageResponse<CheckInDto> mine(UUID userId, int page, int size) {
        return PageResponse.of(
                checkInRepository.findByUser_IdOrderByCreatedAtDesc(userId, Pages.of(page, size))
                        .map(this::toDto)
        );
    }

    public Optional<CheckIn> findValidRecent(UUID userId, UUID placeId) {
        return checkInRepository.findFirstByUser_IdAndPlace_IdAndValidTrueAndCreatedAtAfterOrderByCreatedAtDesc(
                userId,
                placeId,
                Instant.now().minus(window)
        );
    }

    public Instant validUntil(CheckIn checkIn) {
        return checkIn.getCreatedAt().plus(window);
    }

    private CheckInDto toDto(CheckIn checkIn) {
        return new CheckInDto(
                checkIn.getId(),
                checkIn.getPlace().getId(),
                checkIn.getPlace().getName(),
                checkIn.getDistanceMeters(),
                checkIn.getCreatedAt(),
                validUntil(checkIn)
        );
    }
}
