package com.gosafe.gosafe_backend.user;

import com.gosafe.gosafe_backend.common.Errors;
import com.gosafe.gosafe_backend.common.PageResponse;
import com.gosafe.gosafe_backend.common.Pages;
import com.gosafe.gosafe_backend.reputation.ReputationService;
import com.gosafe.gosafe_backend.user.dto.ChangePasswordRequest;
import com.gosafe.gosafe_backend.user.dto.UpdateProfileRequest;
import com.gosafe.gosafe_backend.user.dto.UserDto;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ReputationService reputationService;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            ReputationService reputationService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.reputationService = reputationService;
    }

    public User getActive(UUID id) {
        return userRepository.findById(id)
                .filter(User::getActive)
                .orElseThrow(() -> Errors.notFound("Usuária não encontrada"));
    }

    @Transactional(readOnly = true)
    public UserDto me(UUID id) {
        return toDto(getActive(id));
    }

    @Transactional
    public UserDto updateProfile(UUID id, UpdateProfileRequest request) {
        User user = getActive(id);
        String username = request.username().trim().toLowerCase(Locale.ROOT);

        userRepository.findByUsernameIgnoreCase(username)
                .filter(found -> !found.getId().equals(id))
                .ifPresent(found -> {
                    throw Errors.conflict("Nome de usuária já está em uso");
                });

        user.setName(request.name().trim());
        user.setUsername(username);
        user.setPhotoUrl(request.photoUrl());

        return toDto(user);
    }

    @Transactional
    public void changePassword(UUID id, ChangePasswordRequest request) {
        User user = getActive(id);

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw Errors.badRequest("Senha atual incorreta");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
    }

    @Transactional
    public void deactivate(UUID id) {
        getActive(id).setActive(false);
    }

    @Transactional(readOnly = true)
    public PageResponse<UserDto> list(int page, int size) {
        return PageResponse.of(
                userRepository.findAll(Pages.of(page, size, Sort.by("createdAt").descending()))
                        .map(this::toDto)
        );
    }

    public UserDto toDto(User user) {
        return new UserDto(
                user.getId(),
                user.getName(),
                user.getUsername(),
                user.getEmail(),
                user.getSex(),
                user.getPhotoUrl(),
                user.getVerified(),
                user.getRole(),
                user.getValidContributions(),
                reputationService.profileWeight(user),
                user.getCreatedAt()
        );
    }
}
