# =====================================================================
# Flotilla Manager — Dockerfile
# Multi-stage build: compile → package → runtime mínimo
# Target: Azure App Service (Linux) / Azure Container Registry
# =====================================================================

# ── Stage 1: Build ────────────────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-21 AS builder

WORKDIR /build

# Copiar solo el pom.xml primero para cachear dependencias de Maven.
# Si el pom.xml no cambia, Docker reutiliza esta capa.
COPY pom.xml .
RUN mvn dependency:go-offline -B --no-transfer-progress

# Copiar el código fuente y compilar
COPY src ./src
RUN mvn clean package -DskipTests -B --no-transfer-progress


# ── Stage 2: Runtime ──────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-jammy

# Metadatos
LABEL maintainer="anjrojas@gbm.net"
LABEL app="flotilla-manager-backend"
LABEL version="1.0.0"

# Usuario no-root para seguridad
RUN groupadd --gid 1001 flotilla && \
    useradd --uid 1001 --gid flotilla --no-create-home flotilla

WORKDIR /app

# Directorio para uploads locales (solo dev; en prod usa Azure Blob)
RUN mkdir -p /app/uploads && chown -R flotilla:flotilla /app

# Copiar el JAR desde la etapa de build
COPY --from=builder /build/target/flotilla-backend-*.jar app.jar
RUN chown flotilla:flotilla app.jar

USER flotilla

# Puerto expuesto (Azure App Service mapea 8080 automáticamente)
EXPOSE 8080

# ── Variables de entorno de producción ────────────────────────────────
# Estas se definen en Azure App Service → Configuration → Application Settings
# y en Azure Key Vault. NO hardcodear valores aquí.
ENV SPRING_PROFILES_ACTIVE=prod
ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

# ── Healthcheck ───────────────────────────────────────────────────────
# Azure App Service usa este endpoint para saber si el contenedor está listo
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/actuator/health || exit 1

# ── Entrypoint ────────────────────────────────────────────────────────
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
