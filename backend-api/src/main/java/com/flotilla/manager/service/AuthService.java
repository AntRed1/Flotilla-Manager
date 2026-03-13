package com.flotilla.manager.service;

import com.flotilla.manager.dto.request.AuthRequest;
import com.flotilla.manager.dto.response.AuthResponse;
import com.flotilla.manager.entity.User;

public interface AuthService {

    AuthResponse.TokenPair register(AuthRequest.Register request);

    AuthResponse.TokenPair login(AuthRequest.Login request);

    AuthResponse.TokenPair refreshToken(String refreshToken);

    AuthResponse.Profile getProfile(User currentUser);

    void logout(User currentUser);

    void changePassword(User currentUser, AuthRequest.ChangePassword request);
}
