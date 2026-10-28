package com.gosafe.gosafe_backend.verification;

import com.gosafe.gosafe_backend.common.Errors;
import com.gosafe.gosafe_backend.user.User;
import com.gosafe.gosafe_backend.user.UserService;
import com.gosafe.gosafe_backend.verification.dto.VerificationDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class VerificationService {

    private final FaceVerificationRepository verificationRepository;
    private final VerificationProvider provider;
    private final UserService userService;

    public VerificationService(
            FaceVerificationRepository verificationRepository,
            VerificationProvider provider,
            UserService userService
    ) {
        this.verificationRepository = verificationRepository;
        this.provider = provider;
        this.userService = userService;
    }

    @Transactional
    public VerificationDto verify(UUID userId) {
        User user = userService.getActive(userId);

        if (Boolean.TRUE.equals(user.getVerified())) {
            throw Errors.conflict("Identidade já verificada");
        }

        Instant consentAt = Instant.now();
        VerificationProvider.Result result = provider.verify(userId);

        FaceVerification verification = new FaceVerification();

        verification.setUser(user);
        verification.setProvider(provider.name());
        verification.setLivenessOk(result.livenessOk());
        verification.setFacematchScore(result.facematchScore());
        verification.setStatus(result.approved() ? VerificationStatus.APPROVED : VerificationStatus.REJECTED);
        verification.setConsentAt(consentAt);
        verification.setValidatedAt(Instant.now());

        if (result.approved()) {
            user.setVerified(true);
        }

        return toDto(verificationRepository.save(verification));
    }

    @Transactional(readOnly = true)
    public VerificationDto latest(UUID userId) {
        return verificationRepository.findFirstByUser_IdOrderByCreatedAtDesc(userId)
                .map(this::toDto)
                .orElseThrow(() -> Errors.notFound("Nenhuma verificação encontrada"));
    }

    private VerificationDto toDto(FaceVerification verification) {
        return new VerificationDto(
                verification.getId(),
                verification.getStatus(),
                verification.getProvider(),
                verification.getLivenessOk(),
                verification.getFacematchScore(),
                verification.getConsentAt(),
                verification.getValidatedAt()
        );
    }
}
