package com.gosafe.gosafe_backend.it;

import com.gosafe.gosafe_backend.geo.dto.AddressDto;
import com.gosafe.gosafe_backend.geo.dto.CoordinatesDto;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.hamcrest.Matchers.allOf;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.lessThanOrEqualTo;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class VerificationAndGeoApiTest extends PostgisIntegrationTest {

    @Test
    void simulatedVerificationFlow() throws Exception {
        Account account = register();

        call(get("/me/verification"), account)
                .andExpect(status().isNotFound());

        call(post("/me/verification"), account, "{}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.consent").exists());

        call(post("/me/verification"), account, "{\"consent\":false}")
                .andExpect(status().isBadRequest());

        call(post("/me/verification"), account, "{\"consent\":true}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("APPROVED"))
                .andExpect(jsonPath("$.provider").value("SIMULATED"))
                .andExpect(jsonPath("$.livenessOk").value(true))
                .andExpect(jsonPath("$.facematchScore")
                        .value(allOf(greaterThanOrEqualTo(0.85), lessThanOrEqualTo(0.99))));

        call(get("/me"), account)
                .andExpect(jsonPath("$.verified").value(true))
                .andExpect(jsonPath("$.reputationWeight").value(0.4));

        call(get("/me/verification"), account)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        call(post("/me/verification"), account, "{\"consent\":true}")
                .andExpect(status().isConflict());

        call(post("/me/verification"), null, "{\"consent\":true}")
                .andExpect(status().isUnauthorized());
    }

    @Test
    void postalCodeLookup() throws Exception {
        Account account = register();
        when(geocodingService.lookupPostalCode("01310100"))
                .thenReturn(new AddressDto("01310-100", "Avenida Paulista", null, "Bela Vista", "São Paulo", "SP"));

        call(get("/geo/postal-code/01310100"), null)
                .andExpect(status().isUnauthorized());

        call(get("/geo/postal-code/01310100"), account)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.street").value("Avenida Paulista"))
                .andExpect(jsonPath("$.city").value("São Paulo"));
    }

    @Test
    void geocodeFoundNotFoundAndMissingParameter() throws Exception {
        Account account = register();
        when(geocodingService.geocode(any(), any(), any(), any(), any(), any()))
                .thenReturn(Optional.of(new CoordinatesDto(-23.56, -46.65, "NOMINATIM", "Av. Paulista")));

        call(get("/geo/geocode").param("street", "Av. Paulista").param("number", "1000")
                .param("city", "São Paulo").param("state", "SP"), account)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.latitude").value(-23.56))
                .andExpect(jsonPath("$.source").value("NOMINATIM"));

        when(geocodingService.geocode(any(), any(), any(), any(), any(), any())).thenReturn(Optional.empty());

        call(get("/geo/geocode").param("street", "Rua Inexistente")
                .param("city", "Lugar Nenhum").param("state", "XX"), account)
                .andExpect(status().isNotFound());

        call(get("/geo/geocode").param("street", "Av. Paulista"), account)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Parâmetro obrigatório: city"));
    }
}
