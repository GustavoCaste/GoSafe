package com.gosafe.gosafe_backend.security;

import com.gosafe.gosafe_backend.user.UserRepository;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;

@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * A autenticação é feita só por JWT; este bean apenas impede o Spring de
     * criar o usuário em memória padrão.
     */
    @Bean
    public UserDetailsService userDetailsService() {
        return username -> {
            throw new UsernameNotFoundException(username);
        };
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtService jwtService,
            UserRepository userRepository
    ) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers("/error").permitAll()
                        .requestMatchers(HttpMethod.POST, "/auth/register", "/auth/login").permitAll()
                        .requestMatchers(HttpMethod.GET, "/places", "/places/**", "/notices/**").permitAll()
                        .requestMatchers("/admin/users/**").hasRole("ADMIN")
                        .requestMatchers("/admin/**").hasAnyRole("ADMIN", "MODERATOR")
                        .anyRequest().authenticated()
                )
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, ex) ->
                                writeError(response, 401, "Autenticação necessária"))
                        .accessDeniedHandler((request, response, ex) ->
                                writeError(response, 403, "Acesso negado"))
                )
                .addFilterBefore(
                        new JwtAuthenticationFilter(jwtService, userRepository),
                        UsernamePasswordAuthenticationFilter.class
                )
                .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    private static void writeError(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        String reason = status == 401 ? "Unauthorized" : "Forbidden";
        response.getWriter().write(
                "{\"status\":" + status
                        + ",\"error\":\"" + reason
                        + "\",\"message\":\"" + message
                        + "\",\"fields\":null,\"timestamp\":\"" + Instant.now() + "\"}"
        );
    }
}
