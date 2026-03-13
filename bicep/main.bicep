// ============================================================
// Flotilla — Azure Blob Storage (Receipts)
// Tier: Cool LRS — mínimo costo, alta durabilidad
// ============================================================
targetScope = 'resourceGroup'

@description('Entorno: dev | staging | prod')
@allowed(['dev', 'staging', 'prod'])
param environment string = 'dev'

@description('Región Azure')
param location string = resourceGroup().location

@description('Nombre base de la app')
param appName string = 'flotilla'

var suffix          = uniqueString(resourceGroup().id)
var storageAcctName = '${appName}${environment}${take(suffix, 6)}'
var containerName   = 'receipts'

// ── Storage Account ──────────────────────────────────────────
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAcctName
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  properties: {
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    accessTier: 'Cool'
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
}

// ── Blob Service ─────────────────────────────────────────────
resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    deleteRetentionPolicy: {
      enabled: true
      days: 7
    }
  }
}

// ── Container privado ────────────────────────────────────────
resource receiptsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: containerName
  properties: {
    publicAccess: 'None'
    metadata: {
      purpose: 'fuel-expense-receipts'
      app: 'flotilla'
    }
  }
}

// ── Lifecycle: Archive a 90 días, delete a 365 días ──────────
resource lifecyclePolicy 'Microsoft.Storage/storageAccounts/managementPolicies@2023-01-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    policy: {
      rules: [
        {
          name: 'receipts-lifecycle'
          enabled: true
          type: 'Lifecycle'
          definition: {
            filters: {
              blobTypes: ['blockBlob']
              prefixMatch: ['receipts/']
            }
            actions: {
              baseBlob: {
                tierToArchive: {
                  daysAfterModificationGreaterThan: 90
                }
                delete: {
                  daysAfterModificationGreaterThan: 365
                }
              }
              snapshot: {
                delete: {
                  daysAfterCreationGreaterThan: 7
                }
              }
            }
          }
        }
      ]
    }
  }
}

// ── Outputs ──────────────────────────────────────────────────
output storageAccountName string = storageAccount.name
output containerName      string = containerName
output blobEndpoint       string = storageAccount.properties.primaryEndpoints.blob

@description('Guardar en .env como AZURE_STORAGE_CONNECTION_STRING')
#disable-next-line outputs-should-not-contain-secrets
output connectionString string = 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=core.windows.net'
