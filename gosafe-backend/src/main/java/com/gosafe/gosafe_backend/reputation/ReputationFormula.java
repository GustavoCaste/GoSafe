package com.gosafe.gosafe_backend.reputation;

/**
 * Reputação ponderada inspirada em Bishr e Mantelas (2008): o histórico da
 * contribuidora e a proximidade com o local (check-in) servem de indicador da
 * qualidade da avaliação. Os coeficientes são um ponto de partida a calibrar.
 */
public final class ReputationFormula {

    public static final double MIN_WEIGHT = 0.1;
    public static final double MAX_WEIGHT = 1.0;
    public static final double BASE_WEIGHT = 0.2;
    public static final double CHECK_IN_BONUS = 1.25;

    static final double AGE_FACTOR = 0.3;
    static final double CONTRIBUTION_FACTOR = 0.3;
    static final double VERIFIED_FACTOR = 0.2;
    static final double UPHELD_REPORT_PENALTY = 0.3;
    static final double FULL_AGE_DAYS = 90.0;
    static final double FULL_CONTRIBUTIONS = 20.0;

    private ReputationFormula() {
    }

    public static double profileWeight(
            long accountAgeDays,
            int validContributions,
            boolean verified,
            long upheldReports
    ) {
        double age = Math.min(Math.max(accountAgeDays, 0) / FULL_AGE_DAYS, 1.0);
        double contributions = Math.min(Math.max(validContributions, 0) / FULL_CONTRIBUTIONS, 1.0);
        double upheldRate = upheldReports / (double) Math.max(validContributions + upheldReports, 1);

        double weight = BASE_WEIGHT
                + AGE_FACTOR * age
                + CONTRIBUTION_FACTOR * contributions
                + (verified ? VERIFIED_FACTOR : 0.0)
                - UPHELD_REPORT_PENALTY * upheldRate;

        return round(clamp(weight));
    }

    public static double voteWeight(double profileWeight, boolean withCheckIn) {
        double weight = profileWeight * (withCheckIn ? CHECK_IN_BONUS : 1.0);
        return round(Math.min(MAX_WEIGHT, weight));
    }

    /**
     * Média simples dos parâmetros informados; valores nulos (ex.: banheiro
     * "não há") ficam fora da conta.
     */
    public static double averageScore(Integer... values) {
        double sum = 0;
        int count = 0;

        for (Integer value : values) {
            if (value != null) {
                sum += value;
                count++;
            }
        }

        if (count == 0) {
            throw new IllegalArgumentException("Ao menos um parâmetro deve ser informado");
        }

        return Math.round(sum / count * 100.0) / 100.0;
    }

    private static double clamp(double weight) {
        return Math.max(MIN_WEIGHT, Math.min(MAX_WEIGHT, weight));
    }

    private static double round(double value) {
        return Math.round(value * 1000.0) / 1000.0;
    }
}
