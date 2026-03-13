package com.flotilla.manager.service;

import org.springframework.web.multipart.MultipartFile;

/**
 * Abstracción de almacenamiento de archivos.
 *
 * Implementaciones: - LocalFileStorageService (app.storage.provider=local —
 * default dev) - AzureBlobStorageService (app.storage.provider=azure — prod)
 */
public interface FileStorageService {

    /**
     * Guarda el archivo y retorna el identificador (filename o blob path).
     */
    String storeFile(MultipartFile file);

    /**
     * Elimina el archivo dado su identificador.
     */
    void deleteFile(String fileIdentifier);

    /**
     * Genera la URL pública o firmada para acceder al archivo. Por defecto
     * retorna null — cada implementación la sobreescribe.
     */
    default String resolveUrl(String fileIdentifier, String baseUrl) {
        if (fileIdentifier == null || fileIdentifier.isBlank()) {
            return null;
        }
        return baseUrl + "/uploads/" + fileIdentifier;
    }
}
