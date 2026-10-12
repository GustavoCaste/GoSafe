package com.gosafe.gosafe_backend.reputation;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ReputationFormulaTest {

    @Test
    void newAccountStartsWithBaseWeight() {
        assertEquals(0.2, ReputationFormula.profileWeight(0, 0, false, 0));
    }

    @Test
    void verificationAddsWeight() {
        assertEquals(0.4, ReputationFormula.profileWeight(0, 0, true, 0));
    }

    @Test
    void veteranVerifiedAccountReachesMaximum() {
        assertEquals(1.0, ReputationFormula.profileWeight(365, 50, true, 0));
    }

    @Test
    void ageAndContributionsGrowGradually() {
        // 45 dias = metade do fator de idade; 10 contribuições = metade do fator de contribuição
        assertEquals(0.5, ReputationFormula.profileWeight(45, 10, false, 0));
    }

    @Test
    void upheldReportsReduceWeightButNeverBelowMinimum() {
        assertEquals(0.1, ReputationFormula.profileWeight(0, 0, false, 5));
        // 0,2 + 0,3 (idade) + 0,15 (10 contribuições) − 0,3 × 5/15 (denúncias procedentes)
        assertEquals(0.55, ReputationFormula.profileWeight(90, 10, false, 5));
    }

    @Test
    void checkInBonusIsCappedAtMaximum() {
        assertEquals(0.25, ReputationFormula.voteWeight(0.2, true));
        assertEquals(0.2, ReputationFormula.voteWeight(0.2, false));
        assertEquals(1.0, ReputationFormula.voteWeight(0.9, true));
    }

    @Test
    void averageIgnoresMissingRestroom() {
        assertEquals(3.5, ReputationFormula.averageScore(4, 2, 3, 5, null));
        assertEquals(3.4, ReputationFormula.averageScore(4, 2, 3, 5, 3));
        assertThrows(IllegalArgumentException.class, () -> ReputationFormula.averageScore((Integer) null));
    }
}
