package com.gosafe.gosafe_backend.verification;

import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Verificação simulada, sem custo, para o protótipo do TCC. Não recebe nem
 * armazena imagens: sempre aprova com prova de vida positiva e uma pontuação
 * de facematch determinística entre 0,85 e 0,99.
 */
@Component
public class SimulatedVerificationProvider implements VerificationProvider {

    static final double APPROVAL_THRESHOLD = 0.80;

    @Override
    public String name() {
        return "SIMULATED";
    }

    @Override
    public Result verify(UUID userId) {
        double score = 0.85 + Math.floorMod(userId.hashCode(), 15) / 100.0;
        return new Result(true, score, score >= APPROVAL_THRESHOLD);
    }
}
