#!/bin/bash
# ============================================================
# Flotilla Manager — Deploy a Azure v3
# Arquitectura: App Service B1 (Docker directo)
#               + MySQL Flexible Server (westus2)
#               + Blob Storage
#               SIN Key Vault (política corporativa GBM)
#
# Secrets → Azure App Settings (encriptados en reposo)
# Uso: ./deploy.sh
# ============================================================
set -euo pipefail

# ── Configuración ─────────────────────────────────────────────
SUBSCRIPTION_ID="87d62d5f-8c07-4fa2-9af6-90f6de199b44"
RESOURCE_GROUP="flotilla-prod-rg"
LOCATION="eastus"
MYSQL_LOCATION="westus2"
DOCKER_IMAGE_TAG="1.0.0"
MYSQL_ADMIN_USER="flotillaadmin"
STORAGE_ACCOUNT_NAME="flotillaprodukuyrz"

# ── Colores ───────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'
YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC}  $1"; }
success() { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

step() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE} $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# ── Prerequisitos ─────────────────────────────────────────────
command -v az   &>/dev/null || error "Azure CLI no encontrado"
command -v jq   &>/dev/null || error "jq no encontrado"
command -v curl &>/dev/null || error "curl no encontrado"
az account show &>/dev/null || error "No logueado. Ejecuta: az login"

az account set --subscription "$SUBSCRIPTION_ID"
success "Suscripción: $SUBSCRIPTION_ID"

echo ""
echo "════════════════════════════════════════════════════════"
echo "  Flotilla Manager — Azure Deploy v3"
echo "  Imagen:     antred1/flotilla-backend:${DOCKER_IMAGE_TAG}"
echo "  Storage:    ${STORAGE_ACCOUNT_NAME}"
echo "  RG:         ${RESOURCE_GROUP} (${LOCATION})"
echo "  MySQL:      Flexible Server (${MYSQL_LOCATION})"
echo "  Secrets:    App Settings (sin Key Vault)"
echo "════════════════════════════════════════════════════════"

# ── Paso 1: Credenciales ──────────────────────────────────────
step "1/4  Configuración de credenciales"

echo -n "  Password MySQL admin '${MYSQL_ADMIN_USER}' (mín. 8 chars): "
read -rs MYSQL_ADMIN_PASSWORD; echo ""
[ ${#MYSQL_ADMIN_PASSWORD} -lt 8 ] && error "Password debe tener al menos 8 caracteres"

# JWT Secret generado automáticamente
JWT_SECRET=$(openssl rand -base64 48 | tr -d '\n/+=' | cut -c1-64)
success "Credenciales listas (JWT generado automáticamente)"

# ── Paso 2: Resource Group ────────────────────────────────────
step "2/4  Resource Group"

if ! az group show --name "$RESOURCE_GROUP" &>/dev/null; then
    info "Creando Resource Group '$RESOURCE_GROUP'..."
    az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output none
    success "Resource Group creado"
else
    success "Resource Group '$RESOURCE_GROUP' ya existe"
fi

# ── Paso 3: Bicep ─────────────────────────────────────────────
step "3/4  Infraestructura Bicep"
info "Esto tarda ~5-8 minutos..."

# CORS incluye la URL del App Service (la conocemos por el suffix)
SUFFIX=$(az group show --name "$RESOURCE_GROUP" --query id -o tsv | md5sum | cut -c1-4 2>/dev/null || \
         python3 -c "import hashlib; print(hashlib.md5('$RESOURCE_GROUP'.encode()).hexdigest()[:4])" 2>/dev/null || \
         echo "ukuy")
APP_URL_PREVIEW="https://flotilla-api-${SUFFIX}.azurewebsites.net"
CORS_ORIGINS="${APP_URL_PREVIEW},capacitor://localhost,http://localhost:5173"

DEPLOY_OUTPUT=$(az deployment group create \
    --resource-group "$RESOURCE_GROUP" \
    --template-file main.bicep \
    --mode Incremental \
    --parameters \
        location="$LOCATION" \
        mysqlLocation="$MYSQL_LOCATION" \
        dockerImageTag="$DOCKER_IMAGE_TAG" \
        storageAccountName="$STORAGE_ACCOUNT_NAME" \
        mysqlAdminUser="$MYSQL_ADMIN_USER" \
        mysqlAdminPassword="$MYSQL_ADMIN_PASSWORD" \
        jwtSecret="$JWT_SECRET" \
        corsOrigins="$CORS_ORIGINS" \
    --query "properties.outputs" \
    --output json)

# Extraer outputs
APP_URL=$(echo "$DEPLOY_OUTPUT"      | jq -r '.appUrl.value')
API_URL=$(echo "$DEPLOY_OUTPUT"      | jq -r '.apiUrl.value')
APP_SERVICE=$(echo "$DEPLOY_OUTPUT"  | jq -r '.appServiceName.value')
BLOB_URL=$(echo "$DEPLOY_OUTPUT"     | jq -r '.blobEndpoint.value')
MYSQL_FQDN=$(echo "$DEPLOY_OUTPUT"   | jq -r '.mysqlFqdn.value')

success "Infraestructura desplegada"
info "  App Service:  $APP_SERVICE"
info "  App URL:      $APP_URL"
info "  MySQL FQDN:   $MYSQL_FQDN"

# ── Paso 4: Inyectar AZURE_STORAGE_CONNECTION_STRING ─────────
step "4/4  Configuración final y arranque"

info "Obteniendo Storage connection string..."
STORAGE_CONN=$(az storage account show-connection-string \
    --name "$STORAGE_ACCOUNT_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query connectionString \
    --output tsv)

# Actualizar CORS con la URL real del App Service
# y agregar el connection string del storage
info "Actualizando App Settings con URL real y Storage..."
az webapp config appsettings set \
    --name "$APP_SERVICE" \
    --resource-group "$RESOURCE_GROUP" \
    --settings \
        "CORS_ORIGINS=${APP_URL},capacitor://localhost,http://localhost:5173" \
        "AZURE_STORAGE_CONNECTION_STRING=${STORAGE_CONN}" \
    --output none
success "App Settings actualizados"

info "Reiniciando App Service..."
az webapp restart \
    --name "$APP_SERVICE" \
    --resource-group "$RESOURCE_GROUP" \
    --output none
success "App Service reiniciado"

info "Esperando que el contenedor arranque (120s)..."
sleep 120

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    "${API_URL}/actuator/health" 2>/dev/null || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
    success "Health check OK — API respondiendo"
elif [ "$HTTP_STATUS" = "503" ]; then
    warn "Health check: 503 — el contenedor aún está arrancando"
    warn "Espera 2 minutos más y prueba: curl ${API_URL}/actuator/health"
else
    warn "Health check: HTTP $HTTP_STATUS"
    warn "Ver logs: az webapp log tail --name $APP_SERVICE --resource-group $RESOURCE_GROUP"
fi

# ── Resumen ───────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════════"
success "Deploy completado"
echo ""
echo "  API URL:      $API_URL"
echo "  Health:       ${API_URL}/actuator/health"
echo "  App Service:  $APP_SERVICE"
echo "  Blob Storage: $BLOB_URL"
echo "  MySQL FQDN:   $MYSQL_FQDN"
echo ""
echo "  Logs en vivo:"
echo "  az webapp log tail --name $APP_SERVICE --resource-group $RESOURCE_GROUP"
echo ""
echo "  Actualizar imagen:"
echo "  az webapp config appsettings set \\"
echo "    --name $APP_SERVICE --resource-group $RESOURCE_GROUP \\"
echo "    --settings DOCKER_IMAGE_TAG=1.0.1"
echo "  az webapp restart --name $APP_SERVICE --resource-group $RESOURCE_GROUP"
echo "════════════════════════════════════════════════════════"