package com.flotilla.manager.service.impl;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.flotilla.manager.dto.request.AuthRequest;
import com.flotilla.manager.dto.response.AuthResponse;
import com.flotilla.manager.entity.CardConfig;
import com.flotilla.manager.entity.User;
import com.flotilla.manager.exception.BadRequestException;
import com.flotilla.manager.exception.ConflictException;
import com.flotilla.manager.exception.ResourceNotFoundException;
import com.flotilla.manager.repository.CardConfigRepository;
import com.flotilla.manager.repository.UserRepository;
import com.flotilla.manager.security.JwtService;
import com.flotilla.manager.service.AuthService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final CardConfigRepository cardConfigRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

    @Override
    @Transactional
    public AuthResponse.TokenPair register(AuthRequest.Register request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException("Ya existe una cuenta con ese correo electrónico");
        }

        User user = User.builder()
                .name(request.name().trim())
                .email(request.email().toLowerCase().trim())
                .password(passwordEncoder.encode(request.password()))
                .role(User.Role.USER)
                .active(true)
                .build();

        user = userRepository.save(user);

        CardConfig config = CardConfig.builder().user(user).build();
        cardConfigRepository.save(config);

        return buildTokenPair(user);
    }

    @Override
    @Transactional
    public AuthResponse.TokenPair login(AuthRequest.Login request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.email().toLowerCase().trim(),
                        request.password()
                )
        );

        User user = userRepository.findByEmail(request.email().toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        return buildTokenPair(user);
    }

    @Override
    @Transactional
    public AuthResponse.TokenPair refreshToken(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new BadRequestException("Refresh token requerido");
        }

        User user = userRepository.findByRefreshToken(refreshToken)
                .orElseThrow(() -> new BadRequestException("Refresh token inválido"));

        if (jwtService.isTokenExpired(refreshToken)) {
            user.setRefreshToken(null);
            userRepository.save(user);
            throw new BadRequestException("Sesión expirada. Por favor inicia sesión nuevamente.");
        }

        return buildTokenPair(user);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse.Profile getProfile(User currentUser) {
        return new AuthResponse.Profile(
                true,
                new AuthResponse.ProfileData(AuthResponse.UserDto.from(currentUser))
        );
    }

    @Override
    @Transactional
    public void logout(User currentUser) {
        userRepository.updateRefreshToken(currentUser.getId(), null);
        log.info("User logged out: {}", currentUser.getEmail());
    }

    @Override
    @Transactional
    public void changePassword(User currentUser, AuthRequest.ChangePassword request) {
        if (!passwordEncoder.matches(request.currentPassword(), currentUser.getPassword())) {
            throw new BadRequestException("La contraseña actual es incorrecta");
        }
        currentUser.setPassword(passwordEncoder.encode(request.newPassword()));
        currentUser.setRefreshToken(null);
        userRepository.save(currentUser);
        log.info("Password changed for user: {}", currentUser.getEmail());
    }

    private AuthResponse.TokenPair buildTokenPair(User user) {
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        userRepository.updateRefreshToken(user.getId(), refreshToken);
        log.info("Auth token issued for: {}", user.getEmail());
        return new AuthResponse.TokenPair(accessToken, refreshToken, AuthResponse.UserDto.from(user));
    }
}
