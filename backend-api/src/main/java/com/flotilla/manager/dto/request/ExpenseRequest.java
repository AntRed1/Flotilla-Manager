package com.flotilla.manager.dto.request;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class ExpenseRequest {

    public record Create(
            @NotNull(message = "El monto es requerido")
            @DecimalMin(value = "0.01", message = "El monto debe ser mayor a 0")
            @DecimalMax(value = "999999.99", message = "El monto excede el límite permitido")
            BigDecimal amount,
            @NotNull(message = "La fecha es requerida")
            LocalDateTime date,
            Long stationId,
            @NotBlank(message = "El ciclo es requerido")
            @Pattern(regexp = "\\d{4}-\\d{2}", message = "El ciclo debe tener formato YYYY-MM")
            String cycleId,
            @Min(value = 0, message = "El odómetro no puede ser negativo")
            Integer odometer,
            @Size(max = 500, message = "Las notas no pueden exceder 500 caracteres")
            String notes
            ) {

    }

    public record Update(
            @DecimalMin(value = "0.01", message = "El monto debe ser mayor a 0")
            BigDecimal amount,
            LocalDateTime date,
            Long stationId,
            @Min(value = 0)
            Integer odometer,
            @Size(max = 500)
            String notes
            ) {

    }
}
