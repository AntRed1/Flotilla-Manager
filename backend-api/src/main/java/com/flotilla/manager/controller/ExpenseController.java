package com.flotilla.manager.controller;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.flotilla.manager.dto.request.ExpenseRequest;
import com.flotilla.manager.dto.response.AppResponse;
import com.flotilla.manager.entity.User;
import com.flotilla.manager.service.ExpenseService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    @GetMapping
    public ResponseEntity<List<AppResponse.ExpenseDto>> getExpenses(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(required = false) String cycle_id,
            @RequestParam(required = false, defaultValue = "500") int limit
    ) {
        return ResponseEntity.ok(expenseService.getExpenses(currentUser, cycle_id));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AppResponse.ExpenseDto> getExpense(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(expenseService.getExpenseById(currentUser, id));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AppResponse.ExpenseDto> createExpense(
            @AuthenticationPrincipal User currentUser,
            @RequestParam("amount") BigDecimal amount,
            @RequestParam("date") String dateStr,
            @RequestParam("cycle_id") String cycleId,
            @RequestParam(value = "station_id", required = false) Long stationId,
            @RequestParam(value = "odometer", required = false) Integer odometer,
            @RequestParam(value = "notes", required = false) String notes,
            @RequestParam(value = "receipt", required = false) MultipartFile receipt
    ) {
        LocalDateTime date = parseDateTime(dateStr);
        ExpenseRequest.Create request = new ExpenseRequest.Create(
                amount, date, stationId, cycleId, odometer, notes
        );
        return ResponseEntity.status(201).body(expenseService.createExpense(currentUser, request, receipt));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AppResponse.ExpenseDto> updateExpense(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id,
            @RequestParam(value = "amount", required = false) BigDecimal amount,
            @RequestParam(value = "date", required = false) String dateStr,
            @RequestParam(value = "station_id", required = false) Long stationId,
            @RequestParam(value = "odometer", required = false) Integer odometer,
            @RequestParam(value = "notes", required = false) String notes,
            @RequestParam(value = "receipt", required = false) MultipartFile receipt
    ) {
        LocalDateTime date = dateStr != null ? parseDateTime(dateStr) : null;
        ExpenseRequest.Update request = new ExpenseRequest.Update(amount, date, stationId, odometer, notes);
        return ResponseEntity.ok(expenseService.updateExpense(currentUser, id, request, receipt));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<AppResponse.MessageResponse> deleteExpense(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id
    ) {
        expenseService.deleteExpense(currentUser, id);
        return ResponseEntity.ok(new AppResponse.MessageResponse(true, "Gasto eliminado correctamente"));
    }

    @GetMapping("/stats/{cycleId}")
    public ResponseEntity<AppResponse.ExpenseStatsDto> getStats(
            @AuthenticationPrincipal User currentUser,
            @PathVariable String cycleId
    ) {
        return ResponseEntity.ok(expenseService.getStats(currentUser, cycleId));
    }

    private LocalDateTime parseDateTime(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) {
            return LocalDateTime.now();
        }
        try {
            if (dateStr.endsWith("Z") || dateStr.contains("+") || dateStr.matches(".*[+-]\\d{2}:\\d{2}$")) {
                return OffsetDateTime.parse(dateStr).toLocalDateTime();
            }
            if (dateStr.contains("T")) {
                return LocalDateTime.parse(dateStr);
            }
            return LocalDateTime.parse(dateStr + "T00:00:00");
        } catch (Exception e) {
            throw new IllegalArgumentException("Formato de fecha inválido: " + dateStr);
        }
    }
}
