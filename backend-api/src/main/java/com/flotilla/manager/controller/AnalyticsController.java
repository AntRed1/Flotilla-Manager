/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.flotilla.manager.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.flotilla.manager.dto.response.AnalyticsResponse;
import com.flotilla.manager.entity.User;
import com.flotilla.manager.service.AnalyticsService;

import lombok.RequiredArgsConstructor;

/**
 *
 * @author anjrojas
 */
@RestController
@RequestMapping("/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    /**
     * GET /analytics/cycles?months=6 Resumen por ciclo: total, cantidad,
     * promedio
     */
    @GetMapping("/cycles")
    public ResponseEntity<AnalyticsResponse.CyclesReport> getCyclesReport(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(defaultValue = "6") int months
    ) {
        return ResponseEntity.ok(analyticsService.getCyclesReport(currentUser, months));
    }

    /**
     * GET /analytics/stations?cycleId=2026-03 Gasto por estación en un ciclo (o
     * todos si no se especifica)
     */
    @GetMapping("/stations")
    public ResponseEntity<AnalyticsResponse.StationsReport> getStationsReport(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(required = false) String cycleId
    ) {
        return ResponseEntity.ok(analyticsService.getStationsReport(currentUser, cycleId));
    }

    /**
     * GET /analytics/summary KPIs globales del usuario: gasto total histórico,
     * promedio mensual, etc.
     */
    @GetMapping("/summary")
    public ResponseEntity<AnalyticsResponse.GlobalSummary> getGlobalSummary(
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(analyticsService.getGlobalSummary(currentUser));
    }
}
