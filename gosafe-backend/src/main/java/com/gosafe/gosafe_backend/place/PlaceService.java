package com.gosafe.gosafe_backend.place;

import com.gosafe.gosafe_backend.place.dto.PlaceDto;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class PlaceService {

    private final PlaceRepository placeRepository;

    public PlaceService(PlaceRepository placeRepository) {
        this.placeRepository = placeRepository;
    }

    private void validarCampos(PlaceDto dto) {
        if (dto == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Dados do local sao obrigatorios"
            );
        }

        if (dto.name() == null || dto.name().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Nome e obrigatorio"
            );
        }

        if (dto.name().length() < 3 || dto.name().length() > 100) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Nome deve possuir entre 3 e 100 caracteres"
            );
        }

        if (dto.category() == null || dto.category().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Categoria e obrigatoria"
            );
        }

        if (dto.category().length() < 3 || dto.category().length() > 50) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Categoria deve possuir entre 3 e 50 caracteres"
            );
        }

        if (dto.address() == null || dto.address().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Endereco e obrigatorio"
            );
        }

        if (dto.address().length() < 5 || dto.address().length() > 200) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Endereco deve possuir entre 5 e 200 caracteres"
            );
        }

        boolean hasLatitude = dto.latitude() != null;
        boolean hasLongitude = dto.longitude() != null;

        if (hasLatitude != hasLongitude) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Latitude e longitude devem ser informadas juntas"
            );
        }

        if (hasLatitude && (dto.latitude() < -90 || dto.latitude() > 90)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Latitude deve estar entre -90 e 90"
            );
        }

        if (hasLongitude && (dto.longitude() < -180 || dto.longitude() > 180)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Longitude deve estar entre -180 e 180"
            );
        }
    }

    public List<PlaceDto> findAll() {
        return placeRepository.findAll()
                .stream()
                .map(this::toDto)
                .toList();
    }

    public PlaceDto findById(UUID id) {
        Place place = placeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Local nao encontrado"
                ));

        return toDto(place);
    }

    public PlaceDto create(PlaceDto dto) {
        validarCampos(dto);

        Place place = new Place();

        place.setName(dto.name());
        place.setCategory(dto.category());
        place.setAddress(dto.address());
        place.setLatitude(dto.latitude());
        place.setLongitude(dto.longitude());
        place.setActive(true);

        return toDto(placeRepository.save(place));
    }

    public PlaceDto update(UUID id, PlaceDto dto) {
        validarCampos(dto);

        Place place = placeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Local nao encontrado"
                ));

        place.setName(dto.name());
        place.setCategory(dto.category());
        place.setAddress(dto.address());
        place.setLatitude(dto.latitude());
        place.setLongitude(dto.longitude());

        if (dto.active() != null) {
            place.setActive(dto.active());
        }

        return toDto(placeRepository.save(place));
    }

    public void delete(UUID id) {
        Place place = placeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Local nao encontrado"
                ));

        placeRepository.delete(place);
    }

    private PlaceDto toDto(Place place) {
        return new PlaceDto(
                place.getId(),
                place.getName(),
                place.getCategory(),
                place.getAddress(),
                place.getLatitude(),
                place.getLongitude(),
                place.getActive()
        );
    }
}
