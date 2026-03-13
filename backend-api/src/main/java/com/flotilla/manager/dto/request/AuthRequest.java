package com.flotilla.manager.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthRequest {

    public record Register(
            @NotBlank(message = "El nombre es requerido")
            @Size(min = 2, max = 100, message = "El nombre debe tener entre 2 y 100 caracteres")
            String name,
            @NotBlank(message = "El email es requerido")
            @Email(message = "El email no es válido")
            String email,
            @NotBlank(message = "La contraseña es requerida")
            @Size(min = 6, max = 100, message = "La contraseña debe tener entre 6 y 100 caracteres")
            String password
            ) {

    }

    public record Login(
            @NotBlank(message = "El email es requerido")
            @Email(message = "El email no es válido")
            String email,
            @NotBlank(message = "La contraseña es requerida")
            String password
            ) {

    }

    public record ChangePassword(
            @NotBlank(message = "La contraseña actual es requerida")
            String currentPassword,
            @NotBlank(message = "La nueva contraseña es requerida")
            @Size(min = 6, max = 100, message = "La contraseña debe tener entre 6 y 100 caracteres")
            String newPassword
            ) {

    }
}
