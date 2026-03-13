package com.flotilla.manager.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public class ConfigRequest {

    public record Update(
            @Size(min = 2, max = 150)
            String cardName,
            @DecimalMin(value = "1.00", message = "El límite debe ser mayor a 0")
            @DecimalMax(value = "9999999.99")
            BigDecimal monthlyLimit,
            @Min(1)
            @Max(31)
            Integer cutoffStartDay,
            @Min(1)
            @Max(31)
            Integer cutoffEndDay,
            @Min(1)
            @Max(31)
            Integer rechargeDay,
            @Size(min = 3, max = 10)
            String currency
            ) {

    }
}
