package com.flotilla.manager.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.flotilla.manager.entity.CardConfig;
import com.flotilla.manager.entity.FuelExpense;
import com.flotilla.manager.entity.GasStation;
import com.flotilla.manager.service.AzureBlobStorageService;
import com.flotilla.manager.service.FileStorageService;

public class AppResponse {

    // =============================================
    // Station
    // =============================================
    public record StationDto(
            Long id, String name, String address,
            String zone, String province,
            boolean isGlobal, LocalDateTime createdAt
            ) {

        public static StationDto from(GasStation s) {
            return new StationDto(s.getId(), s.getName(), s.getAddress(),
                    s.getZone(), s.getProvince(), s.isGlobal(), s.getCreatedAt());
        }
    }

    // =============================================
    // Expense
    // =============================================
    public record ExpenseDto(
            Long id,
            BigDecimal amount,
            String date,
            String registeredAt,
            String cycleId,
            Integer odometer,
            String notes,
            String receiptUrl, // URL firmada (SAS en Azure, /uploads/ en local)
            String receiptImage, // blob path o filename — para referencia interna
            Long stationId,
            String stationName,
            String stationZone
            ) {

        public static ExpenseDto from(FuelExpense e, String baseUrl, FileStorageService storage) {
            // Generar URL firmada si es Azure, URL local si es local
            String receiptUrl = null;
            if (e.getReceiptImage() != null && !e.getReceiptImage().isBlank()) {
                if (storage instanceof AzureBlobStorageService azure) {
                    receiptUrl = azure.generateSasUrl(e.getReceiptImage());
                } else {
                    receiptUrl = storage.resolveUrl(e.getReceiptImage(), baseUrl);
                }
            }
            String date = e.getDate() != null
                    ? e.getDate().toLocalDate().toString()
                    : null;

            String registeredAt = e.getCreatedAt() != null
                    ? e.getCreatedAt().toString()
                    : null;

            return new ExpenseDto(
                    e.getId(), e.getAmount(), date, registeredAt,
                    e.getCycleId(), e.getOdometer(), e.getNotes(),
                    receiptUrl, e.getReceiptImage(),
                    e.getStation() != null ? e.getStation().getId() : null,
                    e.getStation() != null ? e.getStation().getName() : null,
                    e.getStation() != null ? e.getStation().getZone() : null
            );
        }
    }

    // =============================================
    // Config
    // =============================================
    public record ConfigDto(
            Long id, String cardName, BigDecimal monthlyLimit,
            Integer cutoffStartDay, Integer cutoffEndDay,
            Integer rechargeDay, String currency,
            boolean cardBlocked, int daysUntilRecharge
            ) {

        public static ConfigDto from(CardConfig c) {
            LocalDate today = LocalDate.now();
            int day = today.getDayOfMonth();
            int start = c.getCutoffStartDay();
            int end = c.getCutoffEndDay();
            int recharge = c.getRechargeDay();

            boolean blocked = (start > end)
                    ? (day >= start || day <= end)
                    : (day >= start && day <= end);

            int daysUntilRecharge = 0;
            if (blocked) {
                LocalDate rechargeDate;
                if (day >= start) {
                    int nextMonth = today.getMonthValue() == 12 ? 1 : today.getMonthValue() + 1;
                    int nextYear = today.getMonthValue() == 12 ? today.getYear() + 1 : today.getYear();
                    rechargeDate = LocalDate.of(nextYear, nextMonth, recharge);
                } else {
                    rechargeDate = LocalDate.of(today.getYear(), today.getMonth(), recharge);
                    if (!rechargeDate.isAfter(today)) {
                        rechargeDate = rechargeDate.plusMonths(1);
                    }
                }
                daysUntilRecharge = (int) today.until(rechargeDate, java.time.temporal.ChronoUnit.DAYS);
                if (daysUntilRecharge < 0) {
                    daysUntilRecharge = 0;
                }
            }

            return new ConfigDto(c.getId(), c.getCardName(), c.getMonthlyLimit(),
                    c.getCutoffStartDay(), c.getCutoffEndDay(), c.getRechargeDay(),
                    c.getCurrency(), blocked, daysUntilRecharge);
        }
    }

    // =============================================
    // Stats
    // =============================================
    public record ExpenseStatsDto(
            String cycleId, BigDecimal totalSpent, long transactionCount,
            BigDecimal averagePerTransaction, BigDecimal monthlyLimit,
            BigDecimal remainingBalance, double usagePercentage
            ) {

    }

    // =============================================
    // Generic
    // =============================================
    public record MessageResponse(boolean success, String message) {

    }

    public record ListResponse<T>(boolean success, java.util.List<T> data) {

    }

    public record SingleResponse<T>(boolean success, T data) {

    }
}
