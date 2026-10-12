package com.gosafe.gosafe_backend.place;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PlacePhotoRepository extends JpaRepository<PlacePhoto, UUID> {

    List<PlacePhoto> findByPlace_IdOrderByPositionAsc(UUID placeId);

    long countByPlace_Id(UUID placeId);
}
