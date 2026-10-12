package com.gosafe.gosafe_backend.geo;

import com.gosafe.gosafe_backend.common.Errors;
import com.gosafe.gosafe_backend.geo.dto.AddressDto;
import com.gosafe.gosafe_backend.geo.dto.CoordinatesDto;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/geo")
public class GeoController {

    private final GeocodingService geocodingService;

    public GeoController(GeocodingService geocodingService) {
        this.geocodingService = geocodingService;
    }

    @GetMapping("/postal-code/{postalCode}")
    public AddressDto postalCode(@PathVariable String postalCode) {
        return geocodingService.lookupPostalCode(postalCode);
    }

    @GetMapping("/geocode")
    public CoordinatesDto geocode(
            @RequestParam String street,
            @RequestParam(required = false) String number,
            @RequestParam(required = false) String district,
            @RequestParam String city,
            @RequestParam String state,
            @RequestParam(required = false) String postalCode
    ) {
        return geocodingService.geocode(street, number, district, city, state, postalCode)
                .orElseThrow(() -> Errors.notFound("Endereço não localizado; ajuste o pino no mapa"));
    }
}
