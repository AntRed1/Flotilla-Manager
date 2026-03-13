package com.flotilla.manager.service.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.flotilla.manager.dto.request.ExpenseRequest;
import com.flotilla.manager.dto.response.AppResponse;
import com.flotilla.manager.entity.CardConfig;
import com.flotilla.manager.entity.FuelExpense;
import com.flotilla.manager.entity.GasStation;
import com.flotilla.manager.entity.User;
import com.flotilla.manager.exception.ResourceNotFoundException;
import com.flotilla.manager.repository.CardConfigRepository;
import com.flotilla.manager.repository.FuelExpenseRepository;
import com.flotilla.manager.repository.GasStationRepository;
import com.flotilla.manager.service.AzureBlobStorageService;
import com.flotilla.manager.service.ExpenseService;
import com.flotilla.manager.service.FileStorageService;
import com.flotilla.manager.util.RequestUrlUtil;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ExpenseServiceImpl implements ExpenseService {

    private final FuelExpenseRepository expenseRepository;
    private final GasStationRepository stationRepository;
    private final CardConfigRepository configRepository;
    private final FileStorageService fileStorageService;
    private final RequestUrlUtil requestUrlUtil;

    @Override
    @Transactional(readOnly = true)
    public List<AppResponse.ExpenseDto> getExpenses(User user, String cycleId) {
        String baseUrl = requestUrlUtil.getBaseUrl();
        List<FuelExpense> expenses = (cycleId != null && !cycleId.isBlank())
                ? expenseRepository.findByUserIdAndCycleIdWithStation(user.getId(), cycleId)
                : expenseRepository.findAllByUserIdWithStation(user.getId());

        return expenses.stream()
                .map(e -> AppResponse.ExpenseDto.from(e, baseUrl, fileStorageService))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AppResponse.ExpenseDto getExpenseById(User user, Long id) {
        return expenseRepository.findAllByUserIdWithStation(user.getId())
                .stream()
                .filter(e -> e.getId().equals(id))
                .findFirst()
                .map(e -> AppResponse.ExpenseDto.from(e, requestUrlUtil.getBaseUrl(), fileStorageService))
                .orElseThrow(() -> new ResourceNotFoundException("Gasto", id));
    }

    @Override
    @Transactional
    public AppResponse.ExpenseDto createExpense(User user, ExpenseRequest.Create request, MultipartFile receipt) {
        GasStation station = resolveStation(user, request.stationId());

        // Si es Azure, pasar userId para que el blob quede en {userId}/{uuid}.ext
        String receiptFilename = storeWithUserId(receipt, user.getId());

        FuelExpense saved = expenseRepository.save(FuelExpense.builder()
                .user(user)
                .station(station)
                .amount(request.amount())
                .date(request.date())
                .cycleId(request.cycleId())
                .odometer(request.odometer())
                .notes(request.notes())
                .receiptImage(receiptFilename)
                .build());

        expenseRepository.flush();

        final Long savedId = saved.getId();
        return expenseRepository.findAllByUserIdWithStation(user.getId())
                .stream()
                .filter(e -> e.getId().equals(savedId))
                .findFirst()
                .map(e -> AppResponse.ExpenseDto.from(e, requestUrlUtil.getBaseUrl(), fileStorageService))
                .orElse(AppResponse.ExpenseDto.from(saved, requestUrlUtil.getBaseUrl(), fileStorageService));
    }

    @Override
    @Transactional
    public AppResponse.ExpenseDto updateExpense(User user, Long id, ExpenseRequest.Update request, MultipartFile receipt) {
        FuelExpense expense = expenseRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Gasto", id));

        if (request.amount() != null) {
            expense.setAmount(request.amount());
        }
        if (request.date() != null) {
            expense.setDate(request.date());
        }
        if (request.stationId() != null) {
            expense.setStation(resolveStation(user, request.stationId()));
        }
        if (request.odometer() != null) {
            expense.setOdometer(request.odometer());
        }
        if (request.notes() != null) {
            expense.setNotes(request.notes());
        }

        if (receipt != null && !receipt.isEmpty()) {
            fileStorageService.deleteFile(expense.getReceiptImage());
            expense.setReceiptImage(storeWithUserId(receipt, user.getId()));
        }

        expenseRepository.save(expense);
        expenseRepository.flush();

        return expenseRepository.findAllByUserIdWithStation(user.getId())
                .stream()
                .filter(e -> e.getId().equals(id))
                .findFirst()
                .map(e -> AppResponse.ExpenseDto.from(e, requestUrlUtil.getBaseUrl(), fileStorageService))
                .orElse(AppResponse.ExpenseDto.from(expense, requestUrlUtil.getBaseUrl(), fileStorageService));
    }

    @Override
    @Transactional
    public void deleteExpense(User user, Long id) {
        FuelExpense expense = expenseRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Gasto", id));
        fileStorageService.deleteFile(expense.getReceiptImage());
        expenseRepository.delete(expense);
    }

    @Override
    @Transactional(readOnly = true)
    public AppResponse.ExpenseStatsDto getStats(User user, String cycleId) {
        BigDecimal totalSpent = expenseRepository.sumAmountByUserIdAndCycleId(user.getId(), cycleId);
        long count = expenseRepository.countByUserIdAndCycleId(user.getId(), cycleId);

        CardConfig config = configRepository.findByUserId(user.getId())
                .orElse(CardConfig.builder().user(user).build());

        BigDecimal monthlyLimit = config.getMonthlyLimit();
        BigDecimal remaining = monthlyLimit.subtract(totalSpent).max(BigDecimal.ZERO);
        double usagePercentage = monthlyLimit.compareTo(BigDecimal.ZERO) > 0
                ? totalSpent.divide(monthlyLimit, 4, RoundingMode.HALF_UP).doubleValue() * 100
                : 0;
        BigDecimal avg = count > 0
                ? totalSpent.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return new AppResponse.ExpenseStatsDto(
                cycleId, totalSpent, count, avg, monthlyLimit, remaining, usagePercentage
        );
    }

    // ── Helpers ────────────────────────────────────────────────────────────
    private String storeWithUserId(MultipartFile file, Long userId) {
        if (file == null || file.isEmpty()) {
            return null;
        }
        // Si el servicio activo es Azure, usar el método con userId
        if (fileStorageService instanceof AzureBlobStorageService azure) {
            return azure.storeFile(file, userId);
        }
        return fileStorageService.storeFile(file);
    }

    private GasStation resolveStation(User user, Long stationId) {
        if (stationId == null) {
            return null;
        }
        return stationRepository.findByIdAndAvailableForUser(stationId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Estación", stationId));
    }
}
