# Flotilla Manager — Azure Infrastructure

## Arquitectura

```
DockerHub (antred1/flotilla-backend)
         │
         ▼
  Azure App Service B1
  ┌─────────────────────────────┐
  │  Docker Compose             │
  │  ├── backend (Spring Boot)  │──→ Key Vault (secrets)
  │  └── db (MySQL 8)           │──→ Blob Storage (recibos)
  └─────────────────────────────┘
         │
  Persistent Volume (mysql_data)
```

## Costo estimado mensual

| Servicio | SKU | $/mes |
|---|---|---|
| App Service | B1 (1 core, 1.75GB) | ~$13 |
| Key Vault | Standard | ~$0.03 |
| Blob Storage | Standard LRS Cool | ~$0.06 |
| Log Analytics | 5GB gratis | ~$0 |
| **Total** | | **~$13/mes** |

## URL del backend

```
https://flotilla-api-{xxxx}.azurewebsites.net/api
```
El sufijo `xxxx` es determinístico — no cambia entre deploys.

## Deploy

### Prerequisitos
```bash
az login
az account set --subscription "87d62d5f-8c07-4fa2-9af6-90f6de199b44"
# jq: apt install jq / brew install jq / winget install jqlang.jq
```

### Primer deploy
```bash
cd bicep/
chmod +x deploy.sh
./deploy.sh
```

El script hace todo en 6 pasos:
1. Pide passwords MySQL (interactivo, nunca se guardan)
2. Verifica/crea el Resource Group
3. Despliega la infraestructura con Bicep
4. Asigna roles con verificación de propagación
5. Carga todos los secrets en Key Vault
6. Reinicia el App Service y verifica el health

### Actualizar imagen Docker
```bash
# 1. Build y push
docker build -t antred1/flotilla-backend:1.0.1 .
docker push antred1/flotilla-backend:1.0.1

# 2. Actualizar (sin re-desplegar infraestructura)
az webapp config appsettings set \
  --name flotilla-api-{xxxx} \
  --resource-group flotilla-prod-rg \
  --settings DOCKER_IMAGE_TAG=1.0.1

az webapp restart \
  --name flotilla-api-{xxxx} \
  --resource-group flotilla-prod-rg
```

## Secrets en Key Vault

| Secret | Descripción |
|---|---|
| `DB-URL` | JDBC URL → hostname `db` (contenedor MySQL) |
| `DB-USERNAME` | Usuario MySQL (`flotilla`) |
| `DB-PASSWORD` | Password MySQL usuario |
| `MYSQL-PASSWORD` | Password MySQL para Compose |
| `MYSQL-ROOT-PASSWORD` | Password MySQL root para Compose |
| `JWT-SECRET` | Clave JWT (64 chars, generada automáticamente) |
| `CORS-ORIGINS` | URLs permitidas (App Service + Capacitor) |
| `AZURE-STORAGE-CONNECTION-STRING` | Acceso al Blob Storage |

### Actualizar un secret
```bash
az keyvault secret set \
  --vault-name flotilla-kv-{xxxx} \
  --name NOMBRE-DEL-SECRET \
  --value "nuevo-valor"

az webapp restart \
  --name flotilla-api-{xxxx} \
  --resource-group flotilla-prod-rg
```

## Logs en vivo
```bash
az webapp log tail \
  --name flotilla-api-{xxxx} \
  --resource-group flotilla-prod-rg
```

## Archivos

| Archivo | Descripción |
|---|---|
| `main.bicep` | Infraestructura (sin role assignments, sin valores hardcodeados) |
| `docker-compose.yml` | Definición de contenedores (backend + MySQL) |
| `deploy.sh` | Orquestación completa del deploy |
| `README.md` | Este archivo |
| `.gitignore` | Excluye archivos generados |
