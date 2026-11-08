package com.gosafe.gosafe_backend.auth;

import com.gosafe.gosafe_backend.auth.dto.LoginRequest;
import com.gosafe.gosafe_backend.auth.dto.RegisterRequest;
import com.gosafe.gosafe_backend.auth.dto.TokenResponse;
import com.gosafe.gosafe_backend.common.Errors;
import com.gosafe.gosafe_backend.security.JwtService;
import com.gosafe.gosafe_backend.user.Role;
import com.gosafe.gosafe_backend.user.User;
import com.gosafe.gosafe_backend.user.UserRepository;
import com.gosafe.gosafe_backend.user.UserService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final Set<String> adminEmails;

    public AuthService(
            UserRepository userRepository,
            UserService userService,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            @Value("${gosafe.admin-emails:}") String adminEmails
    ) {
        this.userRepository = userRepository;
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.adminEmails = Arrays.stream(adminEmails.split(","))
                .map(email -> email.trim().toLowerCase(Locale.ROOT))
                .filter(email -> !email.isEmpty())
                .collect(Collectors.toUnmodifiableSet());
    }

    @Transactional
    public TokenResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        String username = request.username().trim().toLowerCase(Locale.ROOT);

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw Errors.conflict("E-mail já cadastrado");
        }

        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw Errors.conflict("Nome de usuária já está em uso");
        }

        User user = new User();

        user.setName(request.name().trim());
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setSex(request.sex());
        user.setRole(adminEmails.contains(email) ? Role.ADMIN : Role.USER);

        return tokenFor(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public TokenResponse login(LoginRequest request) {
        String login = request.login().trim();

        User user = (login.contains("@")
                ? userRepository.findByEmailIgnoreCase(login)
                : userRepository.findByUsernameIgnoreCase(login))
                .filter(User::getActive)
                .filter(found -> passwordEncoder.matches(request.password(), found.getPasswordHash()))
                .orElseThrow(() -> Errors.unauthorized("Credenciais inválidas"));

        return tokenFor(user);
    }

    private TokenResponse tokenFor(User user) {
        JwtService.IssuedToken token = jwtService.issue(user);
        return new TokenResponse(token.token(), "Bearer", token.expiresAt(), userService.toDto(user));
    }
}
