/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.flotilla.manager.service.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.flotilla.manager.dto.response.AnalyticsResponse;
import com.flotilla.manager.entity.FuelExpense;
import com.flotilla.manager.entity.User;
import com.flotilla.manager.repository.FuelExpenseRepository;
import com.flotilla.manager.service.AnalyticsService;

import lombok.RequiredArgsConstructor;

/**
 *
 * @author anjrojas
 */
@Service
@RequiredArgsConstructor
public class AnalyticsServiceImpl implements AnalyticsService {

    private final FuelExpenseRepository expenseRepository;

    // ─── Ciclos ──────────────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public AnalyticsResponse.CyclesReport getCyclesReport(User user, int months) {
        // Generar los N últimos cycle IDs (formato "yyyy-MM")
        List<String> cycleIds = generateRecentCycleIds(months);

        List<FuelExpense> allExpenses = expenseRepository.findByUserIdOrderByDateDesc(user.getId());

        // Agrupar por cycleId
        Map<String, List<FuelExpense>> byCycle = allExpenses.stream()
                .filter(e -> cycleIds.contains(e.getCycleId()))
                .collect(Collectors.groupingBy(FuelExpense::getCycleId));

        List<AnalyticsResponse.CycleSummary> cycles = cycleIds.stream()
                .map(cycleId -> {
                    List<FuelExpense> cycleExpenses = byCycle.getOrDefault(cycleId, List.of());
                    BigDecimal total = cycleExpenses.stream()
                            .map(FuelExpense::getAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    long count = cycleExpenses.size();
                    BigDecimal average = count > 0
                            ? total.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP)
                            : BigDecimal.ZERO;
                    return new AnalyticsResponse.CycleSummary(
                            cycleId,
                            formatCycleLabel(cycleId),
                            total,
                            count,
                            average
                    );
                })
                .collect(Collectors.toList());

        // Ciclos con datos para calcular promedios y extremos
        List<AnalyticsResponse.CycleSummary> withData = cycles.stream()
                .filter(c -> c.count() > 0)
                .toList();

        BigDecimal overallAverage = withData.isEmpty() ? BigDecimal.ZERO
                : withData.stream()
                        .map(AnalyticsResponse.CycleSummary::total)
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                        .divide(BigDecimal.valueOf(withData.size()), 2, RoundingMode.HALF_UP);

        String bestCycleId = withData.stream()
                .min(Comparator.comparing(AnalyticsResponse.CycleSummary::total))
                .map(AnalyticsResponse.CycleSummary::cycleId)
                .orElse(null);

        String worstCycleId = withData.stream()
                .max(Comparator.comparing(AnalyticsResponse.CycleSummary::total))
                .map(AnalyticsResponse.CycleSummary::cycleId)
                .orElse(null);

        return new AnalyticsResponse.CyclesReport(cycles, overallAverage, bestCycleId, worstCycleId);
    }

    // ─── Estaciones ──────────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public AnalyticsResponse.StationsReport getStationsReport(User user, String cycleId) {
        List<FuelExpense> expenses = expenseRepository.findByUserIdOrderByDateDesc(user.getId());

        // Filtrar por ciclo si se especifica
        if (cycleId != null && !cycleId.isBlank()) {
            expenses = expenses.stream()
                    .filter(e -> cycleId.equals(e.getCycleId()))
                    .collect(Collectors.toList());
        }

        BigDecimal grandTotal = expenses.stream()
                .map(FuelExpense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Agrupar por estación
        Map<Long, List<FuelExpense>> byStation = expenses.stream()
                .filter(e -> e.getStation() != null)
                .collect(Collectors.groupingBy(e -> e.getStation().getId()));

        List<AnalyticsResponse.StationSummary> stations = byStation.entrySet().stream()
                .map(entry -> {
                    List<FuelExpense> stationExpenses = entry.getValue();
                    FuelExpense sample = stationExpenses.get(0);
                    BigDecimal total = stationExpenses.stream()
                            .map(FuelExpense::getAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    double percentage = grandTotal.compareTo(BigDecimal.ZERO) > 0
                            ? total.divide(grandTotal, 4, RoundingMode.HALF_UP)
                                    .multiply(BigDecimal.valueOf(100))
                                    .doubleValue()
                            : 0.0;
                    return new AnalyticsResponse.StationSummary(
                            sample.getStation().getId(),
                            sample.getStation().getName(),
                            sample.getStation().getZone(),
                            total,
                            stationExpenses.size(),
                            Math.round(percentage * 10.0) / 10.0
                    );
                })
                .sorted(Comparator.comparing(AnalyticsResponse.StationSummary::total).reversed())
                .collect(Collectors.toList());

        return new AnalyticsResponse.StationsReport(cycleId, stations, grandTotal);
    }

    // ─── Global ───────────────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public AnalyticsResponse.GlobalSummary getGlobalSummary(User user) {
        List<FuelExpense> all = expenseRepository.findByUserIdOrderByDateDesc(user.getId());

        BigDecimal totalHistorical = all.stream()
                .map(FuelExpense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalTransactions = all.size();

        Set<String> uniqueCycles = all.stream()
                .map(FuelExpense::getCycleId)
                .collect(Collectors.toSet());
        int activeCycles = uniqueCycles.size();

        BigDecimal monthlyAverage = activeCycles > 0
                ? totalHistorical.divide(BigDecimal.valueOf(activeCycles), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Ciclo actual
        String currentCycleId = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));
        BigDecimal currentMonthSpent = all.stream()
                .filter(e -> currentCycleId.equals(e.getCycleId()))
                .map(FuelExpense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Estación top (histórico)
        String topStation = all.stream()
                .filter(e -> e.getStation() != null)
                .collect(Collectors.groupingBy(
                        e -> e.getStation().getName(),
                        Collectors.reducing(BigDecimal.ZERO, FuelExpense::getAmount, BigDecimal::add)
                ))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);

        return new AnalyticsResponse.GlobalSummary(
                totalHistorical,
                totalTransactions,
                monthlyAverage,
                currentMonthSpent,
                topStation,
                activeCycles
        );
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────
    private List<String> generateRecentCycleIds(int months) {
        List<String> ids = new ArrayList<>();
        LocalDate now = LocalDate.now();
        for (int i = 0; i < months; i++) {
            LocalDate d = now.minusMonths(i);
            ids.add(d.format(DateTimeFormatter.ofPattern("yyyy-MM")));
        }
        return ids;
    }

    private String formatCycleLabel(String cycleId) {
        // "2026-03" → "Mar 2026"
        String[] months = {"Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"};
        String[] parts = cycleId.split("-");
        int month = Integer.parseInt(parts[1]);
        return months[month - 1] + " " + parts[0];
    }
}
