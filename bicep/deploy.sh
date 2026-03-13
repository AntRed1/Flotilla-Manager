#!/bin/bash
# ============================================================
# Script de deploy del Bicep template
# Uso: ./deploy.sh [dev|staging|prod]
# ============================================================
set -e

ENVIRONMENT=${1:-dev}
RESOURCE_GROUP="flotilla-${ENVIRONMENT}-rg"
LOCATION="eastus"

echo "🚀 Deploying Flotilla Storage — env: $ENVIRONMENT"

# Crear resource group si no existe
az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --output none

# Deploy del bicep
RESULT=$(az deployment group create \
  --resource-group "$RESOURCE_GROUP" \
  --template-file bicep/main.bicep \
  --parameters environment="$ENVIRONMENT" \
  --query "properties.outputs" \
  --output json)

echo "✅ Deploy completo"
echo ""
echo "📋 Outputs:"
echo "$RESULT" | jq .

# Extraer connection string y mostrar instrucciones
CONN_STRING=$(echo "$RESULT" | jq -r '.connectionStringSecretValue.value')
BLOB_ENDPOINT=$(echo "$RESULT" | jq -r '.blobEndpoint.value')
STORAGE_NAME=$(echo "$RESULT" | jq -r '.storageAccountName.value')

echo ""
echo "⚙️  Agrega estas variables a tu .env:"
echo "AZURE_STORAGE_CONNECTION_STRING=$CONN_STRING"
echo "AZURE_STORAGE_CONTAINER_NAME=receipts"
echo "AZURE_STORAGE_ACCOUNT_NAME=$STORAGE_NAME"
echo "AZURE_BLOB_ENDPOINT=$BLOB_ENDPOINT"
