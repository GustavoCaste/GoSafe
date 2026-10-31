package com.gosafe.gosafe_backend.place.dto;

import com.gosafe.gosafe_backend.place.PlaceCategory;
import jakarta.validation.constraints.*;

/**
 * Cadastro/edição de local com endereço estruturado. Sem latitude/longitude o
 * backend geocodifica o endereço; com elas, vale o pino ajustado pela usuária.
 */
public record PlaceRequest(
        @NotBlank(message = "Nome é obrigatório")
        @Size(min = 3, max = 100, message = "Nome deve ter entre 3 e 100 caracteres")
        String name,

        @NotNull(message = "Categoria é obrigatória")
        PlaceCategory category,

        @Size(max = 300, message = "Descrição deve ter no máximo 300 caracteres")
        String description,

        @NotBlank(message = "CEP é obrigatório")
        @Pattern(regexp = "^\\d{5}-?\\d{3}$", message = "CEP inválido")
        String postalCode,

        @NotBlank(message = "Logradouro é obrigatório")
        @Size(max = 150, message = "Logradouro deve ter no máximo 150 caracteres")
        String street,

        @NotBlank(message = "Número é obrigatório")
        @Size(max = 20, message = "Número deve ter no máximo 20 caracteres")
        String number,

        @Size(max = 60, message = "Complemento deve ter no máximo 60 caracteres")
        String complement,

        @NotBlank(message = "Bairro é obrigatório")
        @Size(max = 80, message = "Bairro deve ter no máximo 80 caracteres")
        String district,

        @NotBlank(message = "Cidade é obrigatória")
        @Size(max = 80, message = "Cidade deve ter no máximo 80 caracteres")
        String city,

        @NotBlank(message = "UF é obrigatória")
        @Pattern(regexp = "^[A-Za-z]{2}$", message = "UF deve ter 2 letras")
        String state,

        @DecimalMin(value = "-90", message = "Latitude deve estar entre -90 e 90")
        @DecimalMax(value = "90", message = "Latitude deve estar entre -90 e 90")
        Double latitude,

        @DecimalMin(value = "-180", message = "Longitude deve estar entre -180 e 180")
        @DecimalMax(value = "180", message = "Longitude deve estar entre -180 e 180")
        Double longitude
) {
}
