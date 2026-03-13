package com.flotilla.manager.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class StationRequest {

    public record Create(
            @NotBlank(message = "El nombre es requerido")
            @Size(min = 2, max = 150, message = "El nombre debe tener entre 2 y 150 caracteres")
            String name,
            @NotBlank(message = "La dirección es requerida")
            @Size(max = 255)
            String address,
            @Size(max = 100)
            String zone,
            @Size(max = 100)
            String province
            ) {

    }

    public record Update(
            @Size(min = 2, max = 150)
            String name,
            @Size(max = 255)
            String address,
            @Size(max = 100)
            String zone,
            @Size(max = 100)
            String province
            ) {

    }
}
