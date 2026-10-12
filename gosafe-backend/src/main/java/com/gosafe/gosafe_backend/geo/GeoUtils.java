package com.gosafe.gosafe_backend.geo;

public final class GeoUtils {

    private static final double EARTH_RADIUS_METERS = 6_371_000;

    private GeoUtils() {
    }

    /**
     * Distância aproximada em metros (fórmula de haversine). Usada só para
     * exibição; regras como o check-in usam o PostGIS.
     */
    public static double haversineMeters(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);

        return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
