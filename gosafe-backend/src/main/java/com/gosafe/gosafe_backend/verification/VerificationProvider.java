package com.gosafe.gosafe_backend.verification;

import java.util.UUID;

/**
 * Provedor de prova de vida (liveness) + comparação facial (facematch).
 * No TCC usamos {@link SimulatedVerificationProvider}; um provedor real
 * pode substituí-lo implementando esta interface.
 */
public interface VerificationProvider {

    String name();

    Result verify(UUID userId);

    record Result(boolean livenessOk, double facematchScore, boolean approved) {
    }
}
