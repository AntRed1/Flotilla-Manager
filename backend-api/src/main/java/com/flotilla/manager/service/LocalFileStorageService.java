package com.flotilla.manager.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.flotilla.manager.exception.BadRequestException;

import lombok.extern.slf4j.Slf4j;

/**
 * Almacenamiento local en disco. Activo cuando app.storage.provider=local
 * (default). Ideal para desarrollo; en producción usar AzureBlobStorageService.
 */
@Service
@ConditionalOnProperty(
        name = "app.storage.provider",
        havingValue = "local",
        matchIfMissing = true // Default si no se configura
)
@Slf4j
public class LocalFileStorageService implements FileStorageService {

    private final Path uploadPath;

    @Value("${app.upload.allowed-types}")
    private String allowedTypes;

    public LocalFileStorageService(@Value("${app.upload.dir}") String uploadDir) {
        this.uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadPath);
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory: " + uploadDir, e);
        }
    }

    @Override
    public String storeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        validateFile(file);

        String extension = getExtension(file.getOriginalFilename());
        String filename = UUID.randomUUID() + "." + extension;

        try {
            Path targetLocation = this.uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            log.debug("Stored local file: {}", filename);
            return filename;
        } catch (IOException e) {
            throw new RuntimeException("Could not store file " + filename, e);
        }
    }

    @Override
    public void deleteFile(String filename) {
        if (filename == null || filename.isBlank()) {
            return;
        }
        try {
            Path filePath = this.uploadPath.resolve(filename).normalize();
            Files.deleteIfExists(filePath);
            log.debug("Deleted local file: {}", filename);
        } catch (IOException e) {
            log.warn("Could not delete file: {}", filename, e);
        }
    }

    @Override
    public String resolveUrl(String filename, String baseUrl) {
        if (filename == null || filename.isBlank()) {
            return null;
        }
        return baseUrl + "/uploads/" + filename;
    }

    private void validateFile(MultipartFile file) {
        List<String> allowed = List.of(allowedTypes.split(","));
        String contentType = file.getContentType();
        if (contentType == null || !allowed.contains(contentType.trim())) {
            throw new BadRequestException(
                    "Tipo de archivo no permitido. Solo se aceptan imágenes: " + allowedTypes
            );
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "jpg";
        }
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }
}
