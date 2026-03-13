package com.flotilla.manager.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.flotilla.manager.dto.request.StationRequest;
import com.flotilla.manager.dto.response.AppResponse;
import com.flotilla.manager.entity.User;
import com.flotilla.manager.service.StationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/stations")
@RequiredArgsConstructor
public class StationController {

    private final StationService stationService;

    @GetMapping
    public ResponseEntity<List<AppResponse.StationDto>> getStations(
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(stationService.getStations(currentUser));
    }

    @PostMapping
    public ResponseEntity<AppResponse.StationDto> createStation(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody StationRequest.Create request
    ) {
        return ResponseEntity.status(201).body(stationService.createStation(currentUser, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AppResponse.StationDto> updateStation(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id,
            @Valid @RequestBody StationRequest.Update request
    ) {
        return ResponseEntity.ok(stationService.updateStation(currentUser, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<AppResponse.MessageResponse> deleteStation(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id
    ) {
        stationService.deleteStation(currentUser, id);
        return ResponseEntity.ok(new AppResponse.MessageResponse(true, "Estación eliminada"));
    }
}
