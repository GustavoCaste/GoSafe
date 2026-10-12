package com.gosafe.gosafe_backend.common;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

public final class Pages {

    public static final int MAX_SIZE = 50;

    private Pages() {
    }

    public static PageRequest of(int page, int size) {
        return of(page, size, Sort.unsorted());
    }

    public static PageRequest of(int page, int size, Sort sort) {
        if (page < 0) {
            throw Errors.badRequest("Página deve ser maior ou igual a 0");
        }
        if (size < 1 || size > MAX_SIZE) {
            throw Errors.badRequest("Tamanho da página deve estar entre 1 e " + MAX_SIZE);
        }
        return PageRequest.of(page, size, sort);
    }
}
