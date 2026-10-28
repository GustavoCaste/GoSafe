package com.gosafe.gosafe_backend.place;

import com.gosafe.gosafe_backend.checkin.CheckInService;
import com.gosafe.gosafe_backend.common.Errors;
import com.gosafe.gosafe_backend.common.PageResponse;
import com.gosafe.gosafe_backend.common.Pages;
import com.gosafe.gosafe_backend.favorite.FavoriteRepository;
import com.gosafe.gosafe_backend.geo.GeocodingService;
import com.gosafe.gosafe_backend.geo.dto.CoordinatesDto;
import com.gosafe.gosafe_backend.place.dto.*;
import com.gosafe.gosafe_backend.review.PlaceRatingService;
import com.gosafe.gosafe_backend.security.AuthUser;
import com.gosafe.gosafe_backend.user.User;
import com.gosafe.gosafe_backend.user.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class PlaceService {

    static final int MAP_LIMIT = 200;
    static final double DUPLICATE_RADIUS_METERS = 50;
    private static final UUID NO_ID = new UUID(0, 0);

    private final PlaceRepository placeRepository;
    private final PlacePhotoRepository photoRepository;
    private final FavoriteRepository favoriteRepository;
    private final CheckInService checkInService;
    private final PlaceRatingService placeRatingService;
    private final GeocodingService geocodingService;
    private final UserService userService;

    public PlaceService(
            PlaceRepository placeRepository,
            PlacePhotoRepository photoRepository,
            FavoriteRepository favoriteRepository,
            CheckInService checkInService,
            PlaceRatingService placeRatingService,
            GeocodingService geocodingService,
            UserService userService
    ) {
        this.placeRepository = placeRepository;
        this.photoRepository = photoRepository;
        this.favoriteRepository = favoriteRepository;
        this.checkInService = checkInService;
        this.placeRatingService = placeRatingService;
        this.geocodingService = geocodingService;
        this.userService = userService;
    }

    public Place getActive(UUID id) {
        return placeRepository.findById(id)
                .filter(Place::getActive)
                .orElseThrow(() -> Errors.notFound("Local não encontrado"));
    }

    @Transactional(readOnly = true)
    public List<PlacePinDto> map(
            double minLng,
            double minLat,
            double maxLng,
            double maxLat,
            PlaceCategory category
    ) {
        validateCoordinates(minLat, minLng);
        validateCoordinates(maxLat, maxLng);

        if (minLng >= maxLng || minLat >= maxLat) {
            throw Errors.badRequest("Área do mapa inválida: o mínimo deve ser menor que o máximo");
        }

        return placeRepository.findInBoundingBox(
                        minLng, minLat, maxLng, maxLat,
                        category != null ? category.name() : null,
                        MAP_LIMIT
                )
                .stream()
                .map(PlaceMapper::toPin)
                .toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<PlaceSummaryDto> search(
            String q,
            PlaceCategory category,
            String district,
            String city,
            Double lat,
            Double lng,
            PlaceSort sort,
            int page,
            int size
    ) {
        boolean hasPosition = lat != null && lng != null;

        if ((lat == null) != (lng == null)) {
            throw Errors.badRequest("Latitude e longitude devem ser informadas juntas");
        }

        if (hasPosition) {
            validateCoordinates(lat, lng);
        }

        PlaceSort effectiveSort = sort != null ? sort : (hasPosition ? PlaceSort.DISTANCE : PlaceSort.RATING);
        String query = blankToNull(q);

        Page<Place> places;

        if (effectiveSort == PlaceSort.DISTANCE) {
            if (!hasPosition) {
                throw Errors.badRequest("Ordenar por distância exige latitude e longitude");
            }

            places = placeRepository.searchByDistance(
                    query,
                    category != null ? category.name() : null,
                    blankToNull(district),
                    blankToNull(city),
                    lat,
                    lng,
                    Pages.of(page, size)
            );
        } else {
            Sort order = effectiveSort == PlaceSort.NAME
                    ? Sort.by("name").ascending()
                    : Sort.by(Sort.Order.desc("weightedRating").nullsLast(), Sort.Order.asc("name"));
            Pageable pageable = Pages.of(page, size, order);

            places = placeRepository.search(query, category, blankToNull(district), blankToNull(city), pageable);
        }

        return PageResponse.of(places.map(place -> PlaceMapper.toSummary(place, lat, lng)));
    }

    @Transactional(readOnly = true)
    public PlaceDetailDto detail(UUID id, Double lat, Double lng, AuthUser viewer) {
        return toDetail(getActive(id), lat, lng, viewer);
    }

    @Transactional
    public PlaceDetailDto create(PlaceRequest request, AuthUser authUser) {
        User user = userService.getActive(authUser.id());
        Place place = new Place();

        applyRequest(place, request);
        place.setCreatedBy(user);

        return toDetail(placeRepository.save(place), null, null, authUser);
    }

    @Transactional
    public PlaceDetailDto update(UUID id, PlaceRequest request, AuthUser authUser) {
        Place place = getActive(id);

        if (!canEdit(place, authUser)) {
            throw Errors.forbidden("Só quem cadastrou o local ou a moderação pode editá-lo");
        }

        applyRequest(place, request);
        return toDetail(place, null, null, authUser);
    }

    @Transactional
    public void deactivate(UUID id, AuthUser authUser) {
        if (!authUser.isModerator()) {
            throw Errors.forbidden("Só a moderação pode remover locais");
        }

        getActive(id).setActive(false);
    }

    @Transactional
    public PhotoDto addPhoto(UUID placeId, PhotoRequest request, AuthUser authUser) {
        Place place = getActive(placeId);
        User user = userService.getActive(authUser.id());

        PlacePhoto photo = new PlacePhoto();

        photo.setPlace(place);
        photo.setUrl(request.url());
        photo.setPosition((int) photoRepository.countByPlace_Id(placeId));
        photo.setUploadedBy(user);

        if (place.getProfilePhotoUrl() == null) {
            place.setProfilePhotoUrl(request.url());
        }

        return PlaceMapper.toPhoto(photoRepository.save(photo));
    }

    @Transactional(readOnly = true)
    public List<PhotoDto> photos(UUID placeId) {
        getActive(placeId);
        return photoRepository.findByPlace_IdOrderByPositionAsc(placeId)
                .stream()
                .map(PlaceMapper::toPhoto)
                .toList();
    }

    private void applyRequest(Place place, PlaceRequest request) {
        if ((request.latitude() == null) != (request.longitude() == null)) {
            throw Errors.badRequest("Latitude e longitude devem ser informadas juntas");
        }

        String postalCode = GeocodingService.formatPostalCode(request.postalCode());
        String state = request.state().trim().toUpperCase(Locale.ROOT);

        double latitude;
        double longitude;
        GeocodeSource source;

        if (request.latitude() != null) {
            latitude = request.latitude();
            longitude = request.longitude();
            source = GeocodeSource.MANUAL;
        } else {
            CoordinatesDto coordinates = geocodingService.geocode(
                            request.street(),
                            request.number(),
                            request.district(),
                            request.city(),
                            state,
                            postalCode
                    )
                    .orElseThrow(() -> Errors.unprocessable(
                            "Não foi possível localizar o endereço; ajuste o pino no mapa e envie latitude/longitude"
                    ));
            latitude = coordinates.latitude();
            longitude = coordinates.longitude();
            source = GeocodeSource.NOMINATIM;
        }

        String name = request.name().trim();
        UUID excludeId = place.getId() != null ? place.getId() : NO_ID;

        if (placeRepository.existsDuplicateNearby(name, latitude, longitude, DUPLICATE_RADIUS_METERS, excludeId)) {
            throw Errors.conflict("Já existe um local com esse nome a menos de 50 m");
        }

        place.setName(name);
        place.setCategory(request.category());
        place.setDescription(blankToNull(request.description()));
        place.setPostalCode(postalCode);
        place.setStreet(request.street().trim());
        place.setNumber(request.number().trim());
        place.setComplement(blankToNull(request.complement()));
        place.setDistrict(request.district().trim());
        place.setCity(request.city().trim());
        place.setState(state);
        place.setLatitude(latitude);
        place.setLongitude(longitude);
        place.setGeocodeSource(source);
    }

    private PlaceDetailDto toDetail(Place place, Double lat, Double lng, AuthUser viewer) {
        boolean favorite = false;
        Instant checkInValidUntil = null;

        if (viewer != null) {
            favorite = favoriteRepository.existsByUser_IdAndPlace_Id(viewer.id(), place.getId());
            checkInValidUntil = checkInService.findValidRecent(viewer.id(), place.getId())
                    .map(checkInService::validUntil)
                    .orElse(null);
        }

        List<PhotoDto> photos = photoRepository.findByPlace_IdOrderByPositionAsc(place.getId())
                .stream()
                .map(PlaceMapper::toPhoto)
                .toList();

        return new PlaceDetailDto(
                place.getId(),
                place.getName(),
                place.getCategory(),
                place.getDescription(),
                place.getProfilePhotoUrl(),
                place.getPostalCode(),
                place.getStreet(),
                place.getNumber(),
                place.getComplement(),
                place.getDistrict(),
                place.getCity(),
                place.getState(),
                place.getLatitude(),
                place.getLongitude(),
                place.getGeocodeSource(),
                placeRatingService.stats(place.getId()),
                photos,
                PlaceMapper.distance(place, lat, lng),
                favorite,
                checkInValidUntil,
                place.getCreatedBy().getId(),
                viewer != null && canEdit(place, viewer)
        );
    }

    private static boolean canEdit(Place place, AuthUser authUser) {
        return authUser.isModerator() || place.getCreatedBy().getId().equals(authUser.id());
    }

    private static void validateCoordinates(double lat, double lng) {
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            throw Errors.badRequest("Coordenadas fora do intervalo válido");
        }
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
