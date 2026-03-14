#!/bin/bash
# ============================================================
# Flotilla Manager — Deploy completo a Azure
# Uso: ./deploy.sh
# Prerequisitos: az CLI instalado y logueado (az login)
# ============================================================
set -euo pipefail

# ── Configuración del proyecto ────────────────────────────────
# Todos los valores específicos están aquí, no en el Bicep.
RESOURCE_GROUP="flotilla-prod-rg"
LOCATION="eastus"
DOCKER_HUB_USER="antred1"
DOCKER_IMAGE_NAME="flotilla-backend"
DOCKER_IMAGE_TAG="1.0.0"
MYSQL_ADMIN_USER="flotillaadmin"
STORAGE_ACCOUNT_NAME="flotillaprodukuyrz"

# ── Colores ───────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ── Verificar prerequisitos ───────────────────────────────────
command -v az   &>/dev/null || error "Azure CLI no encontrado. Instala desde https://aka.ms/installazurecli"
command -v jq   &>/dev/null || error "jq no encontrado. Instala: apt install jq / brew install jq"
command -v curl &>/dev/null || error "curl no encontrado"
az account show &>/dev/null || error "No estás logueado en Azure. Ejecuta: az login"

echo ""
echo "════════════════════════════════════════════════════════"
echo "  Flotilla Manager — Azure Deploy"
echo "  Imagen:   ${DOCKER_HUB_USER}/${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG}"
echo "  Storage:  ${STORAGE_ACCOUNT_NAME}"
echo "  RG:       ${RESOURCE_GROUP}"
echo "════════════════════════════════════════════════════════"
echo ""

# ── Solicitar secrets de forma segura (nunca en archivos) ─────
info "Configuración de secrets"

echo -n "Password MySQL admin (mín. 8 chars, mayúsculas+números+especial): "
read -rs MYSQL_PASSWORD
echo ""
[ ${#MYSQL_PASSWORD} -lt 8 ] && error "El password debe tener al menos 8 caracteres"

# ── Resource Group ────────────────────────────────────────────
info "Verificando Resource Group '$RESOURCE_GROUP'..."
if ! az group show --name "$RESOURCE_GROUP" &>/dev/null; then
    info "Creando Resource Group '$RESOURCE_GROUP' en $LOCATION..."
    az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output none
fi
success "Resource Group listo"

# ── Deploy Bicep (modo Incremental — no borra recursos existentes) ──
info "Desplegando infraestructura (modo Incremental, ~8-12 min primera vez)..."

DEPLOY_OUTPUT=$(az deployment group create \
    --resource-group "$RESOURCE_GROUP" \
    --template-file main.bicep \
    --mode Incremental \
    --parameters \
    location="$LOCATION" \
    dockerHubUser="$DOCKER_HUB_USER" \
    dockerImageName="$DOCKER_IMAGE_NAME" \
    dockerImageTag="$DOCKER_IMAGE_TAG" \
    mysqlAdminUser="$MYSQL_ADMIN_USER" \
    mysqlAdminPassword="$MYSQL_PASSWORD" \
    storageAccountName="$STORAGE_ACCOUNT_NAME" \
    --query "properties.outputs" \
--output json)

success "Infraestructura desplegada"

# ── Extraer outputs ───────────────────────────────────────────
APP_URL=$(echo "$DEPLOY_OUTPUT"       | jq -r '.appUrl.value')
API_URL=$(echo "$DEPLOY_OUTPUT"       | jq -r '.apiUrl.value')
KV_NAME=$(echo "$DEPLOY_OUTPUT"       | jq -r '.keyVaultName.value')
KV_URI=$(echo "$DEPLOY_OUTPUT"        | jq -r '.keyVaultUri.value')
MYSQL_HOST=$(echo "$DEPLOY_OUTPUT"    | jq -r '.mysqlHost.value')
MYSQL_DB=$(echo "$DEPLOY_OUTPUT"      | jq -r '.mysqlDatabase.value')
APP_SERVICE=$(echo "$DEPLOY_OUTPUT"   | jq -r '.appServiceName.value')
BLOB_ENDPOINT=$(echo "$DEPLOY_OUTPUT" | jq -r '.blobEndpoint.value')

echo ""
info "App URL:       $APP_URL"
info "Key Vault:     $KV_URI"
info "MySQL Host:    $MYSQL_HOST"
info "Blob Endpoint: $BLOB_ENDPOINT"
info "App Service:   $APP_SERVICE"

# ── Asignar rol al usuario actual para escribir en Key Vault ──
echo ""
info "Configurando acceso al Key Vault para este usuario..."
CURRENT_USER_ID=$(az ad signed-in-user show --query id -o tsv)
KV_RESOURCE_ID=$(az keyvault show --name "$KV_NAME" --query id -o tsv)

az role assignment create \
--role "Key Vault Secrets Officer" \
--assignee "$CURRENT_USER_ID" \
--scope "$KV_RESOURCE_ID" \
--output none 2>/dev/null || true

info "Esperando propagación del role assignment (15s)..."
sleep 15

# ── Cargar secrets en Key Vault ───────────────────────────────
info "Cargando secrets en Key Vault '$KV_NAME'..."

# DB-URL con SSL para producción
DB_URL="jdbc:mysql://${MYSQL_HOST}:3306/${MYSQL_DB}?useSSL=true&serverTimezone=America/Santo_Domingo&requireSSL=true&characterEncoding=utf8&connectionCollation=utf8mb4_0900_ai_ci"
az keyvault secret set --vault-name "$KV_NAME" --name "DB-URL"      --value "$DB_URL"          --output none
az keyvault secret set --vault-name "$KV_NAME" --name "DB-USERNAME" --value "$MYSQL_ADMIN_USER" --output none
az keyvault secret set --vault-name "$KV_NAME" --name "DB-PASSWORD" --value "$MYSQL_PASSWORD"   --output none

# JWT-SECRET — generado automáticamente, 64 chars seguros
JWT_SECRET=$(openssl rand -base64 48 | tr -d '\n/+=' | cut -c1-64)
az keyvault secret set --vault-name "$KV_NAME" --name "JWT-SECRET"  --value "$JWT_SECRET"       --output none

# CORS-ORIGINS — URL del App Service + Capacitor
CORS_ORIGINS="${APP_URL},capacitor://localhost,http://localhost:5173"
az keyvault secret set --vault-name "$KV_NAME" --name "CORS-ORIGINS" --value "$CORS_ORIGINS"    --output none

# AZURE-STORAGE-CONNECTION-STRING — obtenida directamente de Azure, sin pedirla al usuario
info "Obteniendo connection string del Storage Account..."
STORAGE_CONN_STRING=$(az storage account show-connection-string \
    --name "$STORAGE_ACCOUNT_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query connectionString \
--output tsv)
az keyvault secret set --vault-name "$KV_NAME" \
--name "AZURE-STORAGE-CONNECTION-STRING" \
--value "$STORAGE_CONN_STRING" \
--output none

success "Todos los secrets cargados en Key Vault"

# ── Reiniciar App Service ─────────────────────────────────────
echo ""
info "Reiniciando App Service para aplicar Key Vault..."
az webapp restart \
--name "$APP_SERVICE" \
--resource-group "$RESOURCE_GROUP" \
--output none
success "App Service reiniciado"

# ── Health check ──────────────────────────────────────────────
echo ""
info "Esperando que el contenedor arranque (90s)..."
sleep 90

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/actuator/health" 2>/dev/null || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
    success "Health check OK — API respondiendo"
else
    warn "Health check devolvió HTTP $HTTP_STATUS — puede estar aún iniciando"
    warn "Ver logs: az webapp log tail --name $APP_SERVICE --resource-group $RESOURCE_GROUP"
fi

# ── Resumen final ─────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════════"
success "Deploy completado exitosamente"
echo ""
echo "  API URL:       $API_URL"
echo "  Health:        ${API_URL}/actuator/health"
echo "  App Service:   $APP_SERVICE"
echo "  Key Vault:     $KV_URI"
echo "  MySQL:         $MYSQL_HOST"
echo "  Blob Storage:  $BLOB_ENDPOINT"
echo ""
echo "  Ver logs en vivo:"
echo "  az webapp log tail --name $APP_SERVICE --resource-group $RESOURCE_GROUP"
echo ""
echo "  Actualizar imagen Docker:"
echo "  az webapp config container set \\"
echo "    --name $APP_SERVICE \\"
echo "    --resource-group $RESOURCE_GROUP \\"
echo "    --docker-custom-image-name ${DOCKER_HUB_USER}/${DOCKER_IMAGE_NAME}:NUEVA_VERSION"
echo "════════════════════════════════════════════════════════"