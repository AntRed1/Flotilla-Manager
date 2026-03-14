# Flotilla Manager — Azure Infrastructure

## Arquitectura

```
DockerHub (antred1/flotilla-backend)
         │
         ▼
  Azure App Service B1  ──→  Key Vault (secrets)
         │
         ▼
  MySQL Flexible B1ms
         │
  Blob Storage (existente)
```

## Costo estimado mensual

| Servicio | SKU | Costo/mes |
|---|---|---|
| App Service | B1 (1 core, 1.75GB) | ~$13 |
| MySQL Flexible Server | Burstable B1ms | ~$13 |
| Key Vault | Standard | ~$0.03 |
| Log Analytics | Pay-as-you-go (5GB gratis) | ~$0 |
| **Total** | | **~$26/mes** |

## URL del backend

```
https://flotilla-api-{xxxx}.azurewebsites.net/api
```
El sufijo de 4 caracteres es determinístico — derivado del resource group, no cambia entre deploys.

## Deploy inicial

### Prerequisitos
```bash
# Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash   # Linux
brew install azure-cli                                    # macOS

# jq
sudo apt install jq   # Linux
brew install jq       # macOS

# Login
az login
az account set --subscription "87d62d5f-8c07-4fa2-9af6-90f6de199b44"
```

### Ejecutar
```bash
cd bicep/
chmod +x deploy.sh
./deploy.sh
```

El script solicita interactivamente:
1. **Password MySQL** — mínimo 8 chars, mayúsculas + números + especial
2. **Connection string del Storage** — desde Azure Portal → Storage Account → Access Keys

Todo lo demás es automático: Bicep deploy, secrets en Key Vault, restart, health check.

## Archivos

| Archivo | Descripción |
|---|---|
| `main.bicep` | Infraestructura — sin valores hardcodeados |
| `deploy.sh` | Variables del proyecto + orquestación del deploy |
| `README.md` | Este archivo |

## Actualizar imagen Docker

```bash
# 1. Build y push nueva versión
docker build -t antred1/flotilla-backend:1.0.1 .
docker push antred1/flotilla-backend:1.0.1

# 2. Actualizar App Service (sin re-deploy de infraestructura)
az webapp config container set \
  --name flotilla-api-{xxxx} \
  --resource-group flotilla-prod-rg \
  --docker-custom-image-name antred1/flotilla-backend:1.0.1
```

## Gestión de secrets

```bash
# Ver secrets existentes
az keyvault secret list --vault-name flotilla-kv-{xxxx} --query "[].name" -o tsv

# Actualizar un secret
az keyvault secret set \
  --vault-name flotilla-kv-{xxxx} \
  --name NOMBRE-DEL-SECRET \
  --value "nuevo-valor"

# Reiniciar App Service para aplicar el cambio
az webapp restart \
  --name flotilla-api-{xxxx} \
  --resource-group flotilla-prod-rg
```

## Reducir costos — parar MySQL cuando no se use

MySQL factura por hora. Pararlo ahorra ~$0.43/día (~$13/mes):

```bash
# Parar
az mysql flexible-server stop \
  --name flotilla-db-{xxxx} \
  --resource-group flotilla-prod-rg

# Iniciar
az mysql flexible-server start \
  --name flotilla-db-{xxxx} \
  --resource-group flotilla-prod-rg
```

> Azure para el servidor automáticamente después de 7 días detenido — requiere inicio manual.

## Ver logs en vivo

```bash
az webapp log tail \
  --name flotilla-api-{xxxx} \
  --resource-group flotilla-prod-rg
```