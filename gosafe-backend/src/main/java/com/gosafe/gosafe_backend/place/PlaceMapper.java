package com.gosafe.gosafe_backend.place;

import com.gosafe.gosafe_backend.geo.GeoUtils;
import com.gosafe.gosafe_backend.place.dto.PhotoDto;
import com.gosafe.gosafe_backend.place.dto.PlacePinDto;
import com.gosafe.gosafe_backend.place.dto.PlaceSummaryDto;

public final class PlaceMapper {

    private PlaceMapper() {
    }

    public static PlaceSummaryDto toSummary(Place place, Double lat, Double lng) {
        return new PlaceSummaryDto(
                place.getId(),
                place.getName(),
                place.getCategory(),
                place.getDescription(),
                place.getProfilePhotoUrl(),
                place.getDistrict(),
                place.getCity(),
                place.getLatitude(),
                place.getLongitude(),
                place.getWeightedRating(),
                place.getRatingCount(),
                distance(place, lat, lng),
                place.getNotRecommended(),
                SafetyAlert.messageFor(place)
        );
    }

    public static PlacePinDto toPin(Place place) {
        return new PlacePinDto(
                place.getId(),
                place.getName(),
                place.getCategory(),
                place.getLatitude(),
                place.getLongitude(),
                place.getWeightedRating(),
                place.getRatingCount(),
                place.getNotRecommended()
        );
    }

    public static PhotoDto toPhoto(PlacePhoto photo) {
        return new PhotoDto(photo.getId(), photo.getUrl(), photo.getPosition(), photo.getCreatedAt());
    }

    static Double distance(Place place, Double lat, Double lng) {
        if (lat == null || lng == null) {
            return null;
        }
        return (double) Math.round(GeoUtils.haversineMeters(lat, lng, place.getLatitude(), place.getLongitude()));
    }
}
