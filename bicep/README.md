# Flotilla — Azure Blob Storage Setup

## Estructura de blobs
```
receipts/
  {userId}/
    {uuid}.jpg    ← comprobante del usuario 1
    {uuid}.png
  {userId}/
    {uuid}.jpg    ← comprobante del usuario 2
```

## Deploy (una sola vez por entorno)

```bash
az login
cd bicep/
./deploy.sh dev      # desarrollo
./deploy.sh prod     # producción
```

Copiar el output `connectionStringSecretValue` al `.env`:

```env
STORAGE_PROVIDER=azure
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
AZURE_STORAGE_CONTAINER_NAME=receipts
SAS_EXPIRY_HOURS=1
```

## Costos estimados (Cool LRS, East US)

| Concepto              | Precio           | 1000 fotos/mes |
|-----------------------|------------------|----------------|
| Almacenamiento        | $0.01/GB/mes     | ~$0.05/mes     |
| Operaciones escritura | $0.10/10k ops    | $0.01/mes      |
| Operaciones lectura   | $0.01/10k ops    | ~$0.00/mes     |
| **Total estimado**    |                  | **~$0.06/mes** |

## Seguridad

- Container **PRIVADO** — sin acceso anónimo
- Acceso solo via **SAS tokens** firmados por el backend (1h por defecto)
- Cada SAS token es único por request, no reutilizable indefinidamente
- Blob path incluye `userId` para aislamiento lógico
- Lifecycle policy: Archive a 90 días, delete a 365 días
