package com.gosafe.gosafe_backend.favorite;

import com.gosafe.gosafe_backend.common.Errors;
import com.gosafe.gosafe_backend.place.Place;
import com.gosafe.gosafe_backend.place.PlaceMapper;
import com.gosafe.gosafe_backend.place.PlaceRepository;
import com.gosafe.gosafe_backend.place.dto.PlaceSummaryDto;
import com.gosafe.gosafe_backend.user.User;
import com.gosafe.gosafe_backend.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final PlaceRepository placeRepository;
    private final UserRepository userRepository;

    public FavoriteService(
            FavoriteRepository favoriteRepository,
            PlaceRepository placeRepository,
            UserRepository userRepository
    ) {
        this.favoriteRepository = favoriteRepository;
        this.placeRepository = placeRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<PlaceSummaryDto> list(UUID userId, Double lat, Double lng) {
        return favoriteRepository.findActiveByUser(userId)
                .stream()
                .map(favorite -> PlaceMapper.toSummary(favorite.getPlace(), lat, lng))
                .toList();
    }

    @Transactional
    public void add(UUID userId, UUID placeId) {
        if (favoriteRepository.existsByUser_IdAndPlace_Id(userId, placeId)) {
            return;
        }

        Place place = placeRepository.findById(placeId)
                .filter(Place::getActive)
                .orElseThrow(() -> Errors.notFound("Local não encontrado"));
        User user = userRepository.getReferenceById(userId);

        favoriteRepository.save(new Favorite(user, place));
    }

    @Transactional
    public void remove(UUID userId, UUID placeId) {
        favoriteRepository.findByUser_IdAndPlace_Id(userId, placeId)
                .ifPresent(favoriteRepository::delete);
    }
}
