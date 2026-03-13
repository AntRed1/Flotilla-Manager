package com.flotilla.manager.dto.response;

import com.flotilla.manager.entity.User;

public class AuthResponse {

    public record UserDto(
            Long id,
            String name,
            String email,
            String role
            ) {

        public static UserDto from(User user) {
            return new UserDto(user.getId(), user.getName(), user.getEmail(), user.getRole().name());
        }
    }

    /**
     * Internal transport object — refresh token goes to HttpOnly cookie, never
     * to JSON body.
     */
    public record TokenPair(
            String accessToken,
            String refreshToken,
            UserDto user
            ) {

        public Success toSuccess() {
            return new Success(true, new LoginData(accessToken, user));
        }
    }

    public record LoginData(
            String accessToken,
            UserDto user
            ) {

    }

    public record Success(
            boolean success,
            LoginData data
            ) {

    }

    public record Profile(
            boolean success,
            ProfileData data
            ) {

    }

    public record ProfileData(UserDto user) {

    }
}
