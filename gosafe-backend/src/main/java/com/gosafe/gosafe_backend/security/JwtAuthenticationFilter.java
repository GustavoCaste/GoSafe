package com.gosafe.gosafe_backend.security;

import com.gosafe.gosafe_backend.user.User;
import com.gosafe.gosafe_backend.user.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

/**
 * Lê o token "Bearer" e autentica a requisição. Token inválido ou conta
 * desativada deixam a requisição anônima; as regras de acesso decidem o resto.
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER = "Bearer ";

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain
    ) throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (header != null && header.startsWith(BEARER)) {
            jwtService.parse(header.substring(BEARER.length()))
                    .flatMap(claims -> parseId(claims.getSubject()))
                    .flatMap(userRepository::findById)
                    .filter(User::getActive)
                    .ifPresent(this::authenticate);
        }

        chain.doFilter(request, response);
    }

    private void authenticate(User user) {
        AuthUser principal = new AuthUser(user.getId(), user.getEmail(), user.getRole());
        var authentication = new UsernamePasswordAuthenticationToken(
                principal,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private static java.util.Optional<UUID> parseId(String subject) {
        try {
            return java.util.Optional.of(UUID.fromString(subject));
        } catch (IllegalArgumentException | NullPointerException ex) {
            return java.util.Optional.empty();
        }
    }
}
