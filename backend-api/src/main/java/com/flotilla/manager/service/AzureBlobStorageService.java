package com.flotilla.manager.service;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.azure.storage.blob.BlobClient;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobServiceClient;
import com.azure.storage.blob.BlobServiceClientBuilder;
import com.azure.storage.blob.models.BlobHttpHeaders;
import com.azure.storage.blob.sas.BlobSasPermission;
import com.azure.storage.blob.sas.BlobServiceSasSignatureValues;
import com.flotilla.manager.exception.BadRequestException;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;

/**
 * Almacenamiento de comprobantes en Azure Blob Storage.
 *
 * Activado con: app.storage.provider=azure
 *
 * Estructura de blobs: receipts/{userId}/{uuid}.{ext} — Cada usuario tiene su
 * propio "folder" lógico. — El container es PRIVADO; las URLs se generan como
 * SAS tokens con expiración de 1 hora para que el frontend pueda mostrar la
 * imagen sin exponerla públicamente.
 */
@Service
@ConditionalOnProperty(name = "app.storage.provider", havingValue = "azure")
@Slf4j
public class AzureBlobStorageService implements FileStorageService {

    @Value("${azure.storage.connection-string}")
    private String connectionString;

    @Value("${azure.storage.container-name:receipts}")
    private String containerName;

    @Value("${app.storage.sas-expiry-hours:1}")
    private int sasExpiryHours;

    private BlobContainerClient containerClient;

    private static final List<String> ALLOWED_TYPES
            = List.of("image/jpeg", "image/png", "image/webp", "image/gif");

    @PostConstruct
    public void init() {
        BlobServiceClient serviceClient = new BlobServiceClientBuilder()
                .connectionString(connectionString)
                .buildClient();

        containerClient = serviceClient.getBlobContainerClient(containerName);

        // Crear el container si no existe (idempotente)
        if (!containerClient.exists()) {
            containerClient.create();
            log.info("Azure Blob container '{}' created", containerName);
        }

        log.info("AzureBlobStorageService initialized — container: {}", containerName);
    }

    /**
     * Sube el archivo a Azure y retorna el blob path relativo. Formato:
     * "{userId}/{uuid}.{ext}"
     *
     * El userId se pasa como prefijo para aislar los archivos de cada usuario.
     */
    public String storeFile(MultipartFile file, Long userId) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        validateFile(file);

        String extension = getExtension(file.getOriginalFilename());
        String blobName = userId + "/" + UUID.randomUUID() + "." + extension;

        try {
            BlobClient blobClient = containerClient.getBlobClient(blobName);

            // Establecer Content-Type correcto para que el browser renderice la imagen
            BlobHttpHeaders headers = new BlobHttpHeaders()
                    .setContentType(file.getContentType());

            blobClient.upload(file.getInputStream(), file.getSize(), true);
            blobClient.setHttpHeaders(headers);

            log.debug("Uploaded blob: {}", blobName);
            return blobName;

        } catch (IOException e) {
            throw new RuntimeException("Error uploading file to Azure Blob Storage", e);
        }
    }

    /**
     * Implementación de la interfaz FileStorageService (sin userId). Usa "0"
     * como prefijo genérico — preferir el método con userId.
     */
    @Override
    public String storeFile(MultipartFile file) {
        return storeFile(file, 0L);
    }

    /**
     * Genera una URL firmada (SAS) con expiración configurable. La URL permite
     * acceso de solo lectura al blob durante el tiempo configurado.
     *
     * @param blobName El path del blob: "{userId}/{uuid}.ext"
     * @return URL completa con SAS token, o null si blobName es null
     */
    public String generateSasUrl(String blobName) {
        if (blobName == null || blobName.isBlank()) {
            return null;
        }

        try {
            BlobClient blobClient = containerClient.getBlobClient(blobName);

            // Solo permiso de lectura
            BlobSasPermission permission = new BlobSasPermission().setReadPermission(true);

            BlobServiceSasSignatureValues sasValues = new BlobServiceSasSignatureValues(
                    OffsetDateTime.now().plusHours(sasExpiryHours),
                    permission
            );

            String sasToken = blobClient.generateSas(sasValues);
            return blobClient.getBlobUrl() + "?" + sasToken;

        } catch (Exception e) {
            log.error("Error generating SAS URL for blob: {}", blobName, e);
            return null;
        }
    }

    @Override
    public void deleteFile(String blobName) {
        if (blobName == null || blobName.isBlank()) {
            return;
        }
        try {
            containerClient.getBlobClient(blobName).deleteIfExists();
            log.debug("Deleted blob: {}", blobName);
        } catch (Exception e) {
            log.warn("Could not delete blob: {}", blobName, e);
        }
    }

    private void validateFile(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType.trim())) {
            throw new BadRequestException(
                    "Tipo de archivo no permitido. Solo se aceptan imágenes JPG, PNG, WebP o GIF."
            );
        }
        // Máximo 10MB
        if (file.getSize() > 10L * 1024 * 1024) {
            throw new BadRequestException("El archivo excede el tamaño máximo permitido de 10MB.");
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "jpg";
        }
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }
}
