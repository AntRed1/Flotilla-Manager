/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.flotilla.manager.dto.response;

import java.math.BigDecimal;
import java.util.List;

/**
 *
 * @author anjrojas
 */
public class AnalyticsResponse {

    // ─── Ciclos ───────────────────────────────────────────────────────────────
    public record CycleSummary(
            String cycleId, // "2026-03"
            String label, // "Mar 2026"
            BigDecimal total,
            long count,
            BigDecimal average
            ) {

    }

    public record CyclesReport(
            List<CycleSummary> cycles,
            BigDecimal overallAverage, // promedio de gasto por ciclo
            String bestCycleId, // ciclo con menor gasto
            String worstCycleId // ciclo con mayor gasto
            ) {

    }

    // ─── Estaciones ──────────────────────────────────────────────────────────
    public record StationSummary(
            Long stationId,
            String stationName,
            String zone,
            BigDecimal total,
            long count,
            double percentage // % del total del periodo
            ) {

    }

    public record StationsReport(
            String cycleId, // null = histórico
            List<StationSummary> stations,
            BigDecimal grandTotal
            ) {

    }

    // ─── Global ───────────────────────────────────────────────────────────────
    public record GlobalSummary(
            BigDecimal totalHistorical,
            long totalTransactions,
            BigDecimal monthlyAverage,
            BigDecimal currentMonthSpent,
            String topStationName,
            int activeCycles
            ) {

    }
}
