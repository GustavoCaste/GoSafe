package com.gosafe.gosafe_backend.geo;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GeoUtilsTest {

    @Test
    void samePointIsZero() {
        assertEquals(0, GeoUtils.haversineMeters(-23.5614, -46.6559, -23.5614, -46.6559), 0.001);
    }

    @Test
    void oneThousandthOfLatitudeDegreeIsAbout111Meters() {
        assertEquals(111.2, GeoUtils.haversineMeters(-23.5610, -46.6560, -23.5620, -46.6560), 0.5);
    }

    @Test
    void postalCodeIsFormatted() {
        assertEquals("01310-100", GeocodingService.formatPostalCode("01310100"));
        assertEquals("01310-100", GeocodingService.formatPostalCode("01310-100"));
    }
}
