package com.flotilla.manager.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.flotilla.manager.dto.request.ConfigRequest;
import com.flotilla.manager.dto.response.AppResponse;
import com.flotilla.manager.entity.User;
import com.flotilla.manager.service.ConfigService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/config")
@RequiredArgsConstructor
public class ConfigController {

    private final ConfigService configService;

    @GetMapping
    public ResponseEntity<AppResponse.ConfigDto> getConfig(
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(configService.getConfig(currentUser));
    }

    @PutMapping
    public ResponseEntity<AppResponse.ConfigDto> updateConfig(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody ConfigRequest.Update request
    ) {
        return ResponseEntity.ok(configService.updateConfig(currentUser, request));
    }
}
