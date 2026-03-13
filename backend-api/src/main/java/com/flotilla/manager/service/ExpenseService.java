package com.flotilla.manager.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.flotilla.manager.dto.request.ExpenseRequest;
import com.flotilla.manager.dto.response.AppResponse;
import com.flotilla.manager.entity.User;

public interface ExpenseService {

    List<AppResponse.ExpenseDto> getExpenses(User user, String cycleId);

    AppResponse.ExpenseDto getExpenseById(User user, Long id);

    AppResponse.ExpenseDto createExpense(User user, ExpenseRequest.Create request, MultipartFile receipt);

    AppResponse.ExpenseDto updateExpense(User user, Long id, ExpenseRequest.Update request, MultipartFile receipt);

    void deleteExpense(User user, Long id);

    AppResponse.ExpenseStatsDto getStats(User user, String cycleId);
}
