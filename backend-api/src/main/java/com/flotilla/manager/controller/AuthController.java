package com.flotilla.manager.controller;

import java.util.Arrays;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.flotilla.manager.dto.request.AuthRequest;
import com.flotilla.manager.dto.response.AppResponse;
import com.flotilla.manager.dto.response.AuthResponse;
import com.flotilla.manager.entity.User;
import com.flotilla.manager.service.AuthService;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    private static final String REFRESH_TOKEN_COOKIE = "refreshToken";
    private static final int REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 días

    @PostMapping("/register")
    public ResponseEntity<AuthResponse.Success> register(
            @Valid @RequestBody AuthRequest.Register request,
            HttpServletResponse response
    ) {
        AuthResponse.TokenPair tokens = authService.register(request);
        setRefreshTokenCookie(response, tokens.refreshToken());
        return ResponseEntity.status(201).body(tokens.toSuccess());
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse.Success> login(
            @Valid @RequestBody AuthRequest.Login request,
            HttpServletResponse response
    ) {
        AuthResponse.TokenPair tokens = authService.login(request);
        setRefreshTokenCookie(response, tokens.refreshToken());
        return ResponseEntity.ok(tokens.toSuccess());
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse.Success> refresh(
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        String refreshToken = extractRefreshTokenFromCookie(request);
        AuthResponse.TokenPair tokens = authService.refreshToken(refreshToken);
        setRefreshTokenCookie(response, tokens.refreshToken());
        return ResponseEntity.ok(tokens.toSuccess());
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse.Profile> getProfile(
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(authService.getProfile(currentUser));
    }

    @PostMapping("/logout")
    public ResponseEntity<AppResponse.MessageResponse> logout(
            @AuthenticationPrincipal User currentUser,
            HttpServletResponse response
    ) {
        authService.logout(currentUser);
        clearRefreshTokenCookie(response);
        return ResponseEntity.ok(new AppResponse.MessageResponse(true, "Sesión cerrada correctamente"));
    }

    @PostMapping("/change-password")
    public ResponseEntity<AppResponse.MessageResponse> changePassword(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody AuthRequest.ChangePassword request,
            HttpServletResponse response
    ) {
        authService.changePassword(currentUser, request);
        clearRefreshTokenCookie(response);
        return ResponseEntity.ok(new AppResponse.MessageResponse(true, "Contraseña actualizada. Por favor inicia sesión nuevamente."));
    }

    // =============================================
    // Cookie helpers
    // =============================================
    private void setRefreshTokenCookie(HttpServletResponse response, String token) {
        Cookie cookie = new Cookie(REFRESH_TOKEN_COOKIE, token);
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // true en producción con HTTPS
        cookie.setPath("/api/auth/refresh");
        cookie.setMaxAge(REFRESH_COOKIE_MAX_AGE);
        response.addCookie(cookie);
    }

    private void clearRefreshTokenCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie(REFRESH_TOKEN_COOKIE, "");
        cookie.setHttpOnly(true);
        cookie.setPath("/api/auth/refresh");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }

    private String extractRefreshTokenFromCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        return Arrays.stream(cookies)
                .filter(c -> REFRESH_TOKEN_COOKIE.equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }
}
