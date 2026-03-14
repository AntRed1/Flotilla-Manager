// ============================================================
// Flotilla Manager — Infrastructure as Code
// Servicios: App Service (B1) + MySQL Flexible (B1ms) +
//            Key Vault (Standard) + Blob Storage + Log Analytics
// Región: eastus | Costo estimado: ~$26/mes
// Deploy: az deployment group create --mode Incremental
// ============================================================
targetScope = 'resourceGroup'

// ── Parámetros ────────────────────────────────────────────────

@description('Región Azure')
param location string = 'eastus'

@description('Versión de la imagen Docker en DockerHub')
param dockerImageTag string

@description('Usuario de DockerHub')
param dockerHubUser string

@description('Nombre de la imagen Docker')
param dockerImageName string

@description('Usuario admin de MySQL')
param mysqlAdminUser string

@secure()
@description('Password admin de MySQL — pasado desde deploy.sh, nunca hardcodeado')
param mysqlAdminPassword string

@description('Nombre del Storage Account existente — pasado desde deploy.sh')
param storageAccountName string

// ── Variables internas ────────────────────────────────────────
var suffix = take(uniqueString(resourceGroup().id), 4)
var appName = 'flotilla'
var appServicePlanName = '${appName}-plan'
var appServiceName = '${appName}-api-${suffix}'
var mysqlServerName = '${appName}-db-${suffix}'
var keyVaultName = '${appName}-kv-${suffix}'
var mysqlDbName = 'flotilla_db'
var logWorkspaceName = '${appName}-logs-${suffix}'
var storageContainerName = 'receipts'

// ── Log Analytics Workspace (5GB/mes gratis) ─────────────────
resource logWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logWorkspaceName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// ── Blob Storage Account ──────────────────────────────────────
// Modo Incremental: si ya existe con este nombre, Azure lo actualiza
// sin borrar datos ni el container receipts existente.
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
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
    allowCrossTenantReplication: false
    allowCrossTenantDelegationSas: false
    encryption: {
      services: {
        blob: {
          keyType: 'Account'
          enabled: true
        }
        file: {
          keyType: 'Account'
          enabled: true
        }
      }
      keySource: 'Microsoft.Storage'
    }
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
      ipRules: []
      virtualNetworkRules: []
    }
  }
}

// ── Blob Service ──────────────────────────────────────────────
resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    deleteRetentionPolicy: {
      enabled: true
      days: 7
    }
    containerDeleteRetentionPolicy: {
      enabled: true
      days: 7
    }
  }
}

// ── Container privado para comprobantes ──────────────────────
resource receiptsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: storageContainerName
  properties: {
    publicAccess: 'None'
    metadata: {
      purpose: 'fuel-expense-receipts'
      app: 'flotilla-manager'
    }
  }
}

// ── Lifecycle policy ──────────────────────────────────────────
// Archive a 90 días, delete a 365 días — minimiza costo de almacenamiento
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
              blobTypes: [
                'blockBlob'
              ]
              prefixMatch: [
                'receipts/'
              ]
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

// ── Diagnostic settings del Storage ──────────────────────────
resource storageDiag 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'storage-diag'
  scope: blobService
  properties: {
    workspaceId: logWorkspace.id
    logs: [
      {
        category: 'StorageRead'
        enabled: true
      }
      {
        category: 'StorageWrite'
        enabled: true
      }
      {
        category: 'StorageDelete'
        enabled: true
      }
    ]
    metrics: [
      {
        category: 'Transaction'
        enabled: true
      }
    ]
  }
}

// ── App Service Plan B1 ───────────────────────────────────────
resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: appServicePlanName
  location: location
  kind: 'linux'
  sku: {
    name: 'B1'
    tier: 'Basic'
  }
  properties: {
    reserved: true
  }
}

// ── App Service (Docker container desde DockerHub) ────────────
resource appService 'Microsoft.Web/sites@2023-12-01' = {
  name: appServiceName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'DOCKER|${dockerHubUser}/${dockerImageName}:${dockerImageTag}'
      alwaysOn: false
      http20Enabled: true
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      healthCheckPath: '/api/actuator/health'
      appSettings: [
        {
          name: 'SPRING_PROFILES_ACTIVE'
          value: 'prod'
        }
        {
          name: 'JAVA_OPTS'
          value: '-Xms256m -Xmx512m -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0'
        }
        {
          name: 'AZURE_KEYVAULT_ENDPOINT'
          value: keyVault.properties.vaultUri
        }
        {
          name: 'STORAGE_PROVIDER'
          value: 'azure'
        }
        {
          name: 'AZURE_STORAGE_CONTAINER_NAME'
          value: storageContainerName
        }
        {
          name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE'
          value: 'false'
        }
        {
          name: 'DOCKER_REGISTRY_SERVER_URL'
          value: 'https://index.docker.io'
        }
        {
          name: 'WEBSITE_HEALTHCHECK_MAXPINGFAILURES'
          value: '3'
        }
      ]
    }
  }
}

// ── Diagnostic settings del App Service ──────────────────────
resource appServiceDiag 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'app-diag'
  scope: appService
  properties: {
    workspaceId: logWorkspace.id
    logs: [
      {
        category: 'AppServiceHTTPLogs'
        enabled: true
      }
      {
        category: 'AppServiceConsoleLogs'
        enabled: true
      }
      {
        category: 'AppServiceAppLogs'
        enabled: true
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
      }
    ]
  }
}

// ── MySQL Flexible Server — Burstable B1ms ────────────────────
resource mysqlServer 'Microsoft.DBforMySQL/flexibleServers@2023-12-30' = {
  name: mysqlServerName
  location: location
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    administratorLogin: mysqlAdminUser
    administratorLoginPassword: mysqlAdminPassword
    version: '8.0.21'
    storage: {
      storageSizeGB: 20
      autoGrow: 'Disabled'
      autoIoScaling: 'Disabled'
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
    maintenanceWindow: {
      customWindow: 'Enabled'
      startHour: 2
      startMinute: 0
      dayOfWeek: 0
    }
  }
}

// ── Base de datos ─────────────────────────────────────────────
resource mysqlDatabase 'Microsoft.DBforMySQL/flexibleServers/databases@2023-12-30' = {
  parent: mysqlServer
  name: mysqlDbName
  properties: {
    charset: 'utf8mb4'
    collation: 'utf8mb4_0900_ai_ci'
  }
}

// ── Firewall MySQL: solo Azure Services ───────────────────────
resource mysqlFirewallAzure 'Microsoft.DBforMySQL/flexibleServers/firewallRules@2023-12-30' = {
  parent: mysqlServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// ── Key Vault Standard ────────────────────────────────────────
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
    enablePurgeProtection: false
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
}

// ── Role: App Service → Key Vault Secrets User ───────────────
resource kvRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, appService.id, 'KeyVaultSecretsUser')
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      '4633458b-17de-408a-b874-0445c86b69e6'
    )
    principalId: appService.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// ── Role: App Service → Storage Blob Data Contributor ────────
// Permite al App Service acceder al Storage via Managed Identity
// (alternativa más segura que connection string, opcional)
resource storageRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageAccount.id, appService.id, 'StorageBlobDataContributor')
  scope: storageAccount
  properties: {
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      'ba92f5b4-2d11-453d-a403-e96b0029c9fe' // Storage Blob Data Contributor
    )
    principalId: appService.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// ── Outputs ───────────────────────────────────────────────────
output appUrl string = 'https://${appService.properties.defaultHostName}'
output apiUrl string = 'https://${appService.properties.defaultHostName}/api'
output appServiceName string = appService.name
output keyVaultUri string = keyVault.properties.vaultUri
output keyVaultName string = keyVault.name
output mysqlHost string = mysqlServer.properties.fullyQualifiedDomainName
output mysqlDatabase string = mysqlDbName
output storageAccountName string = storageAccount.name
output blobEndpoint string = storageAccount.properties.primaryEndpoints.blob
output appServicePrincipalId string = appService.identity.principalId
