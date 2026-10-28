package com.gosafe.gosafe_backend.geo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.gosafe.gosafe_backend.common.Errors;
import com.gosafe.gosafe_backend.geo.dto.AddressDto;
import com.gosafe.gosafe_backend.geo.dto.CoordinatesDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Endereço estruturado → coordenadas. ViaCEP completa o endereço a partir do
 * CEP e o Nominatim (OpenStreetMap) devolve latitude/longitude. A política do
 * Nominatim permite no máximo 1 requisição por segundo, por isso há limite de
 * taxa e cache dos resultados.
 */
@Service
public class GeocodingService {

    private static final Logger log = LoggerFactory.getLogger(GeocodingService.class);
    private static final long MIN_INTERVAL_MS = 1100;

    private final RestClient viaCep;
    private final RestClient nominatim;
    private final Map<String, CoordinatesDto> cache = new ConcurrentHashMap<>();
    private long lastNominatimCall;

    public GeocodingService(
            @Value("${gosafe.geo.user-agent:GoSafe-TCC/0.1 (+https://github.com/GustavoCaste/GoSafe)}") String userAgent
    ) {
        this.viaCep = RestClient.builder()
                .baseUrl("https://viacep.com.br/ws")
                .build();
        this.nominatim = RestClient.builder()
                .baseUrl("https://nominatim.openstreetmap.org")
                .defaultHeader(HttpHeaders.USER_AGENT, userAgent)
                .build();
    }

    public AddressDto lookupPostalCode(String postalCode) {
        String digits = postalCode == null ? "" : postalCode.replaceAll("\\D", "");

        if (digits.length() != 8) {
            throw Errors.badRequest("CEP deve ter 8 dígitos");
        }

        ViaCepResponse response;
        try {
            response = viaCep.get()
                    .uri("/{cep}/json/", digits)
                    .retrieve()
                    .body(ViaCepResponse.class);
        } catch (RestClientException ex) {
            log.warn("Falha ao consultar ViaCEP: {}", ex.getMessage());
            throw Errors.badGateway("Serviço de CEP indisponível no momento");
        }

        if (response == null || response.erro() != null) {
            throw Errors.notFound("CEP não encontrado");
        }

        return new AddressDto(
                formatPostalCode(digits),
                response.logradouro(),
                response.complemento(),
                response.bairro(),
                response.localidade(),
                response.uf()
        );
    }

    public Optional<CoordinatesDto> geocode(
            String street,
            String number,
            String district,
            String city,
            String state,
            String postalCode
    ) {
        String key = Stream.of(street, number, district, city, state, postalCode)
                .map(value -> value == null ? "" : value.trim().toLowerCase(Locale.ROOT))
                .collect(Collectors.joining("|"));

        CoordinatesDto cached = cache.get(key);
        if (cached != null) {
            return Optional.of(cached);
        }

        String streetLine = (blankToEmpty(number) + " " + blankToEmpty(street)).trim();

        Optional<CoordinatesDto> result = search(Map.of(
                "street", streetLine,
                "city", blankToEmpty(city),
                "state", blankToEmpty(state),
                "postalcode", blankToEmpty(postalCode)
        ));

        if (result.isEmpty()) {
            String freeText = Stream.of(street + " " + blankToEmpty(number), district, city, state, "Brasil")
                    .filter(value -> value != null && !value.isBlank())
                    .collect(Collectors.joining(", "));
            result = search(Map.of("q", freeText));
        }

        result.ifPresent(coordinates -> cache.put(key, coordinates));
        return result;
    }

    private Optional<CoordinatesDto> search(Map<String, String> params) {
        throttle();

        try {
            NominatimResult[] results = nominatim.get()
                    .uri(builder -> {
                        builder.path("/search")
                                .queryParam("format", "jsonv2")
                                .queryParam("limit", 1)
                                .queryParam("countrycodes", "br");
                        params.forEach((name, value) -> {
                            if (!value.isBlank()) {
                                builder.queryParam(name, value);
                            }
                        });
                        return builder.build();
                    })
                    .retrieve()
                    .body(NominatimResult[].class);

            if (results == null || results.length == 0) {
                return Optional.empty();
            }

            NominatimResult first = results[0];
            return Optional.of(new CoordinatesDto(
                    Double.parseDouble(first.lat()),
                    Double.parseDouble(first.lon()),
                    "NOMINATIM",
                    first.displayName()
            ));
        } catch (RestClientException | NumberFormatException ex) {
            log.warn("Falha ao geocodificar endereço: {}", ex.getMessage());
            return Optional.empty();
        }
    }

    private synchronized void throttle() {
        long wait = MIN_INTERVAL_MS - (System.currentTimeMillis() - lastNominatimCall);

        if (wait > 0) {
            try {
                Thread.sleep(wait);
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
            }
        }

        lastNominatimCall = System.currentTimeMillis();
    }

    public static String formatPostalCode(String postalCode) {
        String digits = postalCode.replaceAll("\\D", "");
        return digits.length() == 8 ? digits.substring(0, 5) + "-" + digits.substring(5) : postalCode;
    }

    private static String blankToEmpty(String value) {
        return value == null ? "" : value.trim();
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record ViaCepResponse(
            String cep,
            String logradouro,
            String complemento,
            String bairro,
            String localidade,
            String uf,
            Object erro
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record NominatimResult(
            String lat,
            String lon,
            @JsonProperty("display_name") String displayName
    ) {
    }
}
