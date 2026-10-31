package com.gosafe.gosafe_backend.place;

import org.springframework.data.jpa.domain.Specification;

import java.util.Locale;

/**
 * Filtros opcionais da busca de locais. Só entram na consulta os filtros
 * informados — parâmetros nulos em JPQL viram {@code bytea} no PostgreSQL e
 * quebram funções como {@code lower()}.
 */
final class PlaceSpecifications {

    private PlaceSpecifications() {
    }

    static Specification<Place> search(String q, PlaceCategory category, String district, String city) {
        Specification<Place> spec = (root, query, cb) -> cb.isTrue(root.get("active"));

        if (q != null) {
            String pattern = "%" + q.toLowerCase(Locale.ROOT) + "%";
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("name")), pattern));
        }
        if (category != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("category"), category));
        }
        if (district != null) {
            String value = district.toLowerCase(Locale.ROOT);
            spec = spec.and((root, query, cb) -> cb.equal(cb.lower(root.get("district")), value));
        }
        if (city != null) {
            String value = city.toLowerCase(Locale.ROOT);
            spec = spec.and((root, query, cb) -> cb.equal(cb.lower(root.get("city")), value));
        }

        return spec;
    }
}
