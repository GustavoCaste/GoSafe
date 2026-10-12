package com.gosafe.gosafe_backend.geo.dto;

public record AddressDto(
        String postalCode,
        String street,
        String complement,
        String district,
        String city,
        String state
) {
}
