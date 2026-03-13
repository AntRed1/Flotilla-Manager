# Flotilla Manager — Backend API

Spring Boot 3 · Java 21 · MySQL 8 · JWT · Docker · Azure App Service

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Spring Boot 3.3 |
| Language | Java 21 |
| Security | Spring Security 6 + JWT (jjwt 0.12.5) |
| Database | MySQL 8.0 + Spring Data JPA (Hibernate 6) |
| Secrets (dev) | dotenv-java 3.0 |
| Secrets (prod) | Azure Key Vault + Managed Identity |
| Storage | Azure Blob Storage / Local (dev) |
| Build | Maven 3.9 |
| Container | Docker (multi-stage, JRE 21 slim) |
| Deploy | Azure App Service (Linux container) |

---

## Project Structure

```
backend-api/
├── .env                          # Secrets locales — NO subir a Git
├── .gitignore
├── Dockerfile
├── .dockerignore
├── pom.xml
├── KEYVAULT_SETUP.md             # Guía de Azure Key Vault
└── src/main/
    ├── java/com/flotilla/manager/
    │   ├── FlotillaApplication.java      # Carga .env en local, Key Vault en prod
    │   ├── config/
    │   │   ├── SecurityConfig.java       # CORS, JWT filter chain, BCrypt
    │   │   └── FileUploadConfig.java
    │   ├── controller/
    │   │   ├── AuthController.java
    │   │   ├── ConfigController.java
    │   │   ├── StationController.java
    │   │   ├── ExpenseController.java
    │   │   └── AnalyticsController.java
    │   ├── dto/
    │   │   ├── request/                  # DTOs de entrada con Bean Validation
    │   │   └── response/                 # DTOs de salida (Java Records)
    │   ├── entity/
    │   │   ├── BaseEntity.java           # Auditing (createdAt, updatedAt)
    │   │   ├── User.java                 # Implements UserDetails
    │   │   ├── CardConfig.java
    │   │   ├── GasStation.java
    │   │   └── FuelExpense.java
    │   ├── exception/
    │   │   └── GlobalExceptionHandler.java
    │   ├── repository/                   # Spring Data JPA repositories
    │   ├── security/
    │   │   ├── JwtService.java
    │   │   └── JwtAuthenticationFilter.java
    │   ├── service/
    │   │   └── impl/                     # Implementaciones de servicios
    │   └── util/
    │       └── RequestUrlUtil.java
    └── resources/
        ├── application.properties        # Config base (todos los profiles)
        └── application-prod.properties   # Activa Azure Key Vault
```

---

## Profiles

| Profile | Cómo activar | Secretos | Uso |
|---|---|---|---|
| `local` (default) | Sin definir nada | `.env` vía dotenv-java | Desarrollo local |
| `prod` | `SPRING_PROFILES_ACTIVE=prod` | Azure Key Vault + Managed Identity | Docker / Azure App Service |

---

## Desarrollo Local

### 1. Prerrequisitos

- Java 21+
- Maven 3.9+
- MySQL 8.0+
- Docker Desktop (opcional, para correr la imagen localmente)

### 2. Crear la base de datos

```sql
CREATE DATABASE flotilla_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

### 3. Configurar variables de entorno

Copia el `.env.example` como `.env` en la raíz del proyecto y edita los valores:

```bash
cp .env.example .env
```

```env
DB_URL=jdbc:mysql://localhost:3306/flotilla_db?useSSL=false&serverTimezone=America/Santo_Domingo&allowPublicKeyRetrieval=true&createDatabaseIfNotExist=true
DB_USERNAME=root
DB_PASSWORD=tu_password

JWT_SECRET={}
JWT_ACCESS_EXPIRATION=86400000
JWT_REFRESH_EXPIRATION=604800000

CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:8080,https://localhost,capacitor://localhost,http://10.0.2.2:8080

UPLOAD_DIR=uploads
STORAGE_PROVIDER=local

# Azure Blob Storage (si usas azure en local)
AZURE_STORAGE_CONNECTION_STRING={};
AZURE_STORAGE_CONTAINER_NAME=receipts
```

### 4. Arrancar con Maven

```bash
# Profile local (default) — lee el .env automáticamente
mvn spring-boot:run

# Con profile explícito
mvn spring-boot:run -Dspring-boot.run.profiles=local

# Sin Maven wrapper — compilar primero
mvn clean package -DskipTests
java -jar target/flotilla-backend-1.0.0.jar
```

Servidor en: `http://localhost:8080/api`
Healthcheck: `http://localhost:8080/api/actuator/health`

---

## Docker

### Build local de la imagen

```bash
# Desde la raíz del proyecto (donde está el Dockerfile)
docker build -t flotilla-backend:latest .

# Con tag de versión
docker build -t flotilla-backend:1.0.0 .
```

### Correr el contenedor localmente (apuntando a MySQL local)

```bash
docker run -d \
  --name flotilla-backend \
  -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e AZURE_KEYVAULT_ENDPOINT={} \
  flotilla-backend:latest
```

> **Nota:** En prod el contenedor toma los secretos de Key Vault via Managed Identity.
> Para pruebas locales con Docker sin Key Vault, pasa las variables directamente con `-e`:

```bash
docker run -d \
  --name flotilla-local \
  -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=local \
  -e DB_URL="jdbc:mysql://host.docker.internal:3306/flotilla_db?useSSL=false&serverTimezone=America/Santo_Domingo&allowPublicKeyRetrieval=true" \
  -e DB_USERNAME=root \
  -e DB_PASSWORD=tu_password \
  -e JWT_SECRET=FlotillaManager2026SecretKeyMinimo32Chars!! \
  -e CORS_ORIGINS=http://localhost:3000 \
  -e STORAGE_PROVIDER=local \
  flotilla-backend:latest
```

### Comandos útiles de Docker

```bash
# Ver logs en tiempo real
docker logs -f flotilla-backend

# Entrar al contenedor
docker exec -it flotilla-backend sh

# Detener y eliminar
docker stop flotilla-backend && docker rm flotilla-backend

# Limpiar imágenes sin uso
docker image prune -f
```

### Probar el healthcheck

```bash
curl http://localhost:8080/api/actuator/health
```

---

## Despliegue en Azure

> Ver `KEYVAULT_SETUP.md` para la guía completa de Key Vault y Managed Identity.

### 1. Build y push a Azure Container Registry

```bash
# Login al registry
az acr login --name flotillaregistry

# Build directo en ACR (sin Docker local)
az acr build \
  --registry flotillaregistry \
  --image flotilla-backend:latest \
  .

# O push manual desde local
docker tag flotilla-backend:latest flotillaregistry.azurecr.io/flotilla-backend:latest
docker push flotillaregistry.azurecr.io/flotilla-backend:latest
```

### 2. Configurar el App Service

```bash
# Asignar la imagen del ACR
az webapp config container set \
  --name flotilla-backend \
  --resource-group flotilla-prod-rg \
  --docker-custom-image-name flotillaregistry.azurecr.io/flotilla-backend:latest

# App Settings mínimos (los secretos los lee del Key Vault)
az webapp config appsettings set \
  --name flotilla-backend \
  --resource-group flotilla-prod-rg \
  --settings \
    SPRING_PROFILES_ACTIVE=prod \
    AZURE_KEYVAULT_ENDPOINT=https://flotilla-kv.vault.azure.net/ \
    STORAGE_PROVIDER=azure \
    AZURE_STORAGE_CONTAINER_NAME=receipts \
    WEBSITES_PORT=8080
```

### 3. Reiniciar y ver logs

```bash
# Reiniciar el App Service
az webapp restart \
  --name flotilla-backend \
  --resource-group flotilla-prod-rg

# Ver logs del contenedor en tiempo real
az webapp log tail \
  --name flotilla-backend \
  --resource-group flotilla-prod-rg
```

### 4. Deploy con Bicep (infraestructura como código)

```bash
# Desde la carpeta bicep/
az deployment group create \
  --resource-group flotilla-prod-rg \
  --template-file main.bicep \
  --parameters @parameters.json
```

---

## API Endpoints

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | ❌ | Registrar usuario |
| POST | `/auth/login` | ❌ | Login |
| POST | `/auth/refresh` | ❌ | Refrescar access token (cookie) |
| GET | `/auth/me` | ✅ | Perfil del usuario actual |
| POST | `/auth/logout` | ✅ | Logout |
| POST | `/auth/change-password` | ✅ | Cambiar contraseña |

**Response de login:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "user": { "id": 1, "name": "Juan", "email": "juan@email.com", "role": "USER" }
  }
}
```

### Config — `/api/config`

| Method | Path | Description |
|---|---|---|
| GET | `/config` | Obtener configuración de tarjeta |
| PUT | `/config` | Actualizar configuración |

### Estaciones — `/api/stations`

| Method | Path | Description |
|---|---|---|
| GET | `/stations` | Listar estaciones activas |
| POST | `/stations` | Crear estación |
| PUT | `/stations/{id}` | Actualizar estación |
| DELETE | `/stations/{id}` | Eliminar (soft-delete) |

### Gastos — `/api/expenses`

| Method | Path | Description |
|---|---|---|
| GET | `/expenses?cycle_id=2026-03` | Listar gastos por ciclo |
| GET | `/expenses/{id}` | Obtener gasto por ID |
| POST | `/expenses` | Crear gasto (`multipart/form-data`) |
| PUT | `/expenses/{id}` | Actualizar gasto |
| DELETE | `/expenses/{id}` | Eliminar gasto |
| GET | `/expenses/stats/{cycleId}` | Estadísticas del ciclo |

**POST /expenses — campos:**
```
amount=1500.00
date=2026-03-10
cycle_id=2026-03
station_id=1
odometer=45000
notes=Carga completa
receipt=<archivo imagen>
```

### Analytics — `/api/analytics`

| Method | Path | Description |
|---|---|---|
| GET | `/analytics/summary` | Resumen global |
| GET | `/analytics/cycles` | Reporte por ciclos |
| GET | `/analytics/stations` | Reporte por estaciones |

---

## Seguridad

- **JWT Access Token** — 24h, header `Authorization: Bearer <token>`
- **JWT Refresh Token** — 7 días, almacenado en DB + HttpOnly cookie
- **BCrypt** — 12 rounds para hash de contraseñas
- **Row-level security** — todas las queries filtran por `user_id`
- **Managed Identity** — en producción, sin credenciales en código ni archivos

---

## Integración con la app móvil

Archivo `.env` del proyecto React/Capacitor:

```env
# Emulador Android
VITE_API_URL=http://10.0.2.2:8080/api

# Producción
VITE_API_URL=https://flotilla-backend.azurewebsites.net/api
```

---

## Licencia

ARSL v1.0 — Anthony R Software License.  
Propietario, solo visualización, sin uso comercial.  
Contacto: anjrojas@gbm.net