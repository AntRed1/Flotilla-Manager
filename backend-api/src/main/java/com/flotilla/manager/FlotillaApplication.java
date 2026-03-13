package com.flotilla.manager;

import io.github.cdimascio.dotenv.Dotenv;
import io.github.cdimascio.dotenv.DotenvException;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import java.util.Arrays;

@SpringBootApplication
@EnableJpaAuditing
public class FlotillaApplication {

    public static void main(String[] args) {

        // ── Detectar el profile activo ──────────────────────────────────────
        // Se lee de SPRING_PROFILES_ACTIVE (variable de entorno de Docker/Azure)
        // o de -Dspring.profiles.active (argumento JVM).
        // Si no está definido, se asume "local" para no romper el arranque en dev.
        String activeProfiles = System.getenv("SPRING_PROFILES_ACTIVE");
        if (activeProfiles == null) {
            activeProfiles = System.getProperty("spring.profiles.active", "local");
        }

        boolean isLocal = Arrays.stream(activeProfiles.split(","))
                .map(String::trim)
                .anyMatch("local"::equalsIgnoreCase);

        // ── Cargar .env solo en desarrollo local ────────────────────────────
        // En Docker o Azure App Service, las variables llegan como env vars
        // del contenedor o desde Key Vault — este bloque nunca se ejecuta.
        if (isLocal) {
            System.out.println("[Flotilla] Profile 'local' detectado — cargando .env");
            try {
                Dotenv dotenv = Dotenv.configure()
                        .directory("./") // busca .env en la raíz del proyecto
                        .ignoreIfMissing() // no falla si no existe el archivo
                        .load();

                // Registrar cada variable como System property para que
                // Spring Boot las resuelva en application.properties con ${VAR}
                dotenv.entries().forEach(entry -> {
                    // No sobreescribir variables que ya vengan del entorno del SO
                    if (System.getProperty(entry.getKey()) == null
                            && System.getenv(entry.getKey()) == null) {
                        System.setProperty(entry.getKey(), entry.getValue());
                    }
                });

                System.out.println("[Flotilla] .env cargado correctamente");
            } catch (DotenvException e) {
                System.out.println("[Flotilla] .env no encontrado — usando variables del sistema");
            }
        } else {
            // ── Producción (Docker / Azure App Service) ──────────────────────
            // Las variables sensibles vienen de Azure Key Vault (configurado en
            // application-prod.properties via spring-cloud-azure-starter-keyvault-secrets)
            // o del App Service Configuration panel de Azure.
            System.out.println("[Flotilla] Profile '" + activeProfiles + "' — usando variables del entorno/Key Vault");
        }

        SpringApplication.run(FlotillaApplication.class, args);
    }
}
