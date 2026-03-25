// ============================================================
// Flotilla Manager — Infrastructure as Code v3
// Arquitectura:
//   - App Service B1 Linux (imagen Docker directa)
//   - MySQL Flexible Server B1ms (westus2)
//   - Blob Storage
//   - Log Analytics Workspace
//
// SIN Key Vault — secrets inyectados como App Settings
// (encriptados en reposo por Azure App Service)
//
// Regiones:
//   App Service + Storage → eastus
//   MySQL Flexible Server → westus2
// ============================================================
targetScope = 'resourceGroup'

// ── Parámetros ────────────────────────────────────────────────

@description('Región principal')
param location string = 'eastus'

@description('Región para MySQL Flexible Server')
param mysqlLocation string = 'westus2'

@description('Tag de la imagen Docker')
param dockerImageTag string

@description('Nombre del Storage Account')
param storageAccountName string

@description('Usuario administrador MySQL')
param mysqlAdminUser string = 'flotillaadmin'

@secure()
@description('Password administrador MySQL')
param mysqlAdminPassword string

@secure()
@description('JWT Secret (mín. 32 chars)')
param jwtSecret string

@description('CORS origins permitidos')
param corsOrigins string

// ── Variables ─────────────────────────────────────────────────
var suffix = take(uniqueString(resourceGroup().id), 4)
var appName = 'flotilla'
var appServicePlanName = '${appName}-plan'
var appServiceName = '${appName}-api-${suffix}'
var logWorkspaceName = '${appName}-logs-${suffix}'
var mysqlServerName = '${appName}-db-${suffix}'
var mysqlDbName = 'flotilla_db'
var storageContainer = 'receipts'
var mysqlFqdnVar = '${mysqlServerName}.mysql.database.azure.com'
var dbUrl = 'jdbc:mysql://${mysqlFqdnVar}:3306/${mysqlDbName}?useSSL=true&requireSSL=true&serverTimezone=America/Santo_Domingo&allowPublicKeyRetrieval=true&characterEncoding=utf8&connectionCollation=utf8mb4_0900_ai_ci'

// ── Log Analytics Workspace ───────────────────────────────────
resource logWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logWorkspaceName
  location: location
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
  }
}

// ── Storage Account ───────────────────────────────────────────
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  kind: 'StorageV2'
  sku: { name: 'Standard_LRS' }
  properties: {
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    accessTier: 'Cool'
    allowCrossTenantReplication: false
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    deleteRetentionPolicy: { enabled: true, days: 7 }
  }
}

resource receiptsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: storageContainer
  properties: { publicAccess: 'None' }
}

// ── MySQL Flexible Server ─────────────────────────────────────
resource mysqlServer 'Microsoft.DBforMySQL/flexibleServers@2023-12-30' = {
  name: mysqlServerName
  location: mysqlLocation
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    administratorLogin: mysqlAdminUser
    administratorLoginPassword: mysqlAdminPassword
    storage: {
      storageSizeGB: 20
      autoGrow: 'Enabled'
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: { mode: 'Disabled' }
    version: '8.0.21'
  }
}

resource mysqlDatabase 'Microsoft.DBforMySQL/flexibleServers/databases@2023-12-30' = {
  parent: mysqlServer
  name: mysqlDbName
  properties: {
    charset: 'utf8mb4'
    collation: 'utf8mb4_0900_ai_ci'
  }
}

resource mysqlFirewall 'Microsoft.DBforMySQL/flexibleServers/firewallRules@2023-12-30' = {
  parent: mysqlServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// ── App Service Plan B1 Linux ─────────────────────────────────
resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: appServicePlanName
  location: location
  kind: 'linux'
  sku: { name: 'B1', tier: 'Basic' }
  properties: { reserved: true }
}

// ── App Service ───────────────────────────────────────────────
resource appService 'Microsoft.Web/sites@2023-12-01' = {
  name: appServiceName
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'DOCKER|antred1/flotilla-backend:${dockerImageTag}'
      alwaysOn: false
      http20Enabled: true
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      healthCheckPath: '/api/actuator/health'
      appSettings: [
        // ── Docker ──────────────────────────────────────────
        { name: 'DOCKER_REGISTRY_SERVER_URL', value: 'https://index.docker.io' }
        { name: 'WEBSITES_PORT', value: '8080' }
        // ── Spring Boot ──────────────────────────────────────
        { name: 'SPRING_PROFILES_ACTIVE', value: 'prod' }
        { name: 'JAVA_OPTS', value: '-Xms256m -Xmx512m -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0' }
        // ── Database ─────────────────────────────────────────
        { name: 'DB_URL', value: dbUrl }
        { name: 'DB_USERNAME', value: mysqlAdminUser }
        { name: 'DB_PASSWORD', value: mysqlAdminPassword }
        // ── JWT ──────────────────────────────────────────────
        { name: 'JWT_SECRET', value: jwtSecret }
        // ── CORS ─────────────────────────────────────────────
        { name: 'CORS_ORIGINS', value: corsOrigins }
        // ── Storage ──────────────────────────────────────────
        { name: 'STORAGE_PROVIDER', value: 'azure' }
        { name: 'AZURE_STORAGE_CONTAINER_NAME', value: storageContainer }
        // AZURE_STORAGE_CONNECTION_STRING se inyecta en deploy.sh
        // porque requiere la connection string que Azure genera
        // Health check
        { name: 'WEBSITE_HEALTHCHECK_MAXPINGFAILURES', value: '3' }
      ]
    }
  }
}

// ── Diagnostic settings ───────────────────────────────────────
resource appServiceDiag 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'app-diag'
  scope: appService
  properties: {
    workspaceId: logWorkspace.id
    logs: [
      { category: 'AppServiceHTTPLogs', enabled: true }
      { category: 'AppServiceConsoleLogs', enabled: true }
      { category: 'AppServiceAppLogs', enabled: true }
    ]
    metrics: [{ category: 'AllMetrics', enabled: true }]
  }
}

// ── Outputs ───────────────────────────────────────────────────
output appUrl string = 'https://${appService.properties.defaultHostName}'
output apiUrl string = 'https://${appService.properties.defaultHostName}/api'
output appServiceName string = appService.name
output storageAccountId string = storageAccount.id
output blobEndpoint string = storageAccount.properties.primaryEndpoints.blob
output mysqlFqdn string = mysqlServer.properties.fullyQualifiedDomainName
output mysqlDbName string = mysqlDbName
