package com.gosafe.gosafe_backend.review;

import com.gosafe.gosafe_backend.place.Place;
import com.gosafe.gosafe_backend.place.PlaceRepository;
import com.gosafe.gosafe_backend.review.dto.ReviewDto;
import com.gosafe.gosafe_backend.user.User;
import com.gosafe.gosafe_backend.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final PlaceRepository placeRepository;

    public ReviewService(
            ReviewRepository reviewRepository,
            UserRepository userRepository,
            PlaceRepository placeRepository
    ) {
        this.reviewRepository = reviewRepository;
        this.userRepository = userRepository;
        this.placeRepository = placeRepository;
    }

    private void validarCampos(ReviewDto dto) {
        if (dto == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Dados da avaliacao sao obrigatorios"
            );
        }

        if (dto.userId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Usuario e obrigatorio"
            );
        }

        if (dto.placeId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Local e obrigatorio"
            );
        }

        if (dto.safetyPerception() == null || dto.safetyPerception().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Percepcao de seguranca e obrigatoria"
            );
        }

        if (dto.safetyPerception().length() < 3 || dto.safetyPerception().length() > 50) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Percepcao de seguranca deve possuir entre 3 e 50 caracteres"
            );
        }

        if (dto.comment() != null && dto.comment().length() > 1000) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Comentario deve possuir no maximo 1000 caracteres"
            );
        }
    }

    public List<ReviewDto> findAll() {
        return reviewRepository.findAll()
                .stream()
                .map(this::toDto)
                .toList();
    }

    public ReviewDto findById(UUID id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Avaliacao nao encontrada"
                ));

        return toDto(review);
    }

    public ReviewDto create(ReviewDto dto) {
        validarCampos(dto);

        User user = findUser(dto.userId());
        Place place = findPlace(dto.placeId());

        Review review = new Review();

        review.setUser(user);
        review.setPlace(place);
        review.setSafetyPerception(dto.safetyPerception());
        review.setComment(dto.comment());

        return toDto(reviewRepository.save(review));
    }

    public ReviewDto update(UUID id, ReviewDto dto) {
        validarCampos(dto);

        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Avaliacao nao encontrada"
                ));

        User user = findUser(dto.userId());
        Place place = findPlace(dto.placeId());

        review.setUser(user);
        review.setPlace(place);
        review.setSafetyPerception(dto.safetyPerception());
        review.setComment(dto.comment());

        return toDto(reviewRepository.save(review));
    }

    public void delete(UUID id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Avaliacao nao encontrada"
                ));

        reviewRepository.delete(review);
    }

    private User findUser(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Usuario nao encontrado"
                ));
    }

    private Place findPlace(UUID id) {
        return placeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Local nao encontrado"
                ));
    }

    private ReviewDto toDto(Review review) {
        return new ReviewDto(
                review.getId(),
                review.getUser().getId(),
                review.getPlace().getId(),
                review.getSafetyPerception(),
                review.getComment()
        );
    }
}
