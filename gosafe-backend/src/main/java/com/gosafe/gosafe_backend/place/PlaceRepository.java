package com.gosafe.gosafe_backend.place;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface PlaceRepository extends JpaRepository<Place, UUID>, JpaSpecificationExecutor<Place> {

    /** Locais dentro da área visível do mapa (PostGIS). */
    @Query(value = """
            SELECT p.* FROM places p
            WHERE p.active = TRUE
              AND p.geom && ST_MakeEnvelope(:minLng, :minLat, :maxLng, :maxLat, 4326)
              AND (CAST(:category AS TEXT) IS NULL OR p.category = CAST(:category AS TEXT))
            ORDER BY p.weighted_rating DESC NULLS LAST
            LIMIT :maxResults
            """, nativeQuery = true)
    List<Place> findInBoundingBox(
            @Param("minLng") double minLng,
            @Param("minLat") double minLat,
            @Param("maxLng") double maxLng,
            @Param("maxLat") double maxLat,
            @Param("category") String category,
            @Param("maxResults") int maxResults
    );

    /** Busca ordenada pela distância até um ponto (PostGIS). */
    @Query(value = """
            SELECT p.* FROM places p
            WHERE p.active = TRUE
              AND (CAST(:q AS TEXT) IS NULL OR lower(p.name) LIKE lower(concat('%', CAST(:q AS TEXT), '%')))
              AND (CAST(:category AS TEXT) IS NULL OR p.category = CAST(:category AS TEXT))
              AND (CAST(:district AS TEXT) IS NULL OR lower(p.district) = lower(CAST(:district AS TEXT)))
              AND (CAST(:city AS TEXT) IS NULL OR lower(p.city) = lower(CAST(:city AS TEXT)))
            ORDER BY ST_Distance(CAST(p.geom AS geography), CAST(ST_SetSRID(ST_MakePoint(:lng, :lat), 4326) AS geography))
            """,
            countQuery = """
            SELECT count(*) FROM places p
            WHERE p.active = TRUE
              AND (CAST(:q AS TEXT) IS NULL OR lower(p.name) LIKE lower(concat('%', CAST(:q AS TEXT), '%')))
              AND (CAST(:category AS TEXT) IS NULL OR p.category = CAST(:category AS TEXT))
              AND (CAST(:district AS TEXT) IS NULL OR lower(p.district) = lower(CAST(:district AS TEXT)))
              AND (CAST(:city AS TEXT) IS NULL OR lower(p.city) = lower(CAST(:city AS TEXT)))
            """,
            nativeQuery = true)
    Page<Place> searchByDistance(
            @Param("q") String q,
            @Param("category") String category,
            @Param("district") String district,
            @Param("city") String city,
            @Param("lat") double lat,
            @Param("lng") double lng,
            Pageable pageable
    );

    /** RN12: mesmo nome a menos de {@code radius} metros (PostGIS). */
    @Query(value = """
            SELECT EXISTS (
                SELECT 1 FROM places p
                WHERE p.active = TRUE
                  AND p.id <> :excludeId
                  AND lower(p.name) = lower(:name)
                  AND ST_DWithin(CAST(p.geom AS geography), CAST(ST_SetSRID(ST_MakePoint(:lng, :lat), 4326) AS geography), :radius)
            )
            """, nativeQuery = true)
    boolean existsDuplicateNearby(
            @Param("name") String name,
            @Param("lat") double lat,
            @Param("lng") double lng,
            @Param("radius") double radius,
            @Param("excludeId") UUID excludeId
    );

    /** Distância em metros entre o local e um ponto (PostGIS). */
    @Query(value = """
            SELECT ST_Distance(CAST(p.geom AS geography), CAST(ST_SetSRID(ST_MakePoint(:lng, :lat), 4326) AS geography))
            FROM places p
            WHERE p.id = :id
            """, nativeQuery = true)
    Double distanceMeters(@Param("id") UUID id, @Param("lat") double lat, @Param("lng") double lng);
}
