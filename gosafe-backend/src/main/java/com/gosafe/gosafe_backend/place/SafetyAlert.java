package com.gosafe.gosafe_backend.place;

/** Mensagem exibida quando um local está marcado como não aconselhado (RN18). */
public final class SafetyAlert {

    public static final String MESSAGE =
            "Local não aconselhado: as avaliações da comunidade indicam baixo nível de segurança.";

    private SafetyAlert() {
    }

    public static String messageFor(Place place) {
        return Boolean.TRUE.equals(place.getNotRecommended()) ? MESSAGE : null;
    }
}
