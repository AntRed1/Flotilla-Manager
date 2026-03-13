# Manager Flotilla - Sistema de Control de Gastos de Combustible

Sistema profesional de gestión y control de gastos de combustible con interfaz moderna tipo iOS.

## 🚀 Características

- ✅ **Dashboard** con métricas en tiempo real
- 📊 **Análisis** de tendencias y comparativas por ciclos
- 📝 **Historial** completo con filtros avanzados
- ⚙️ **Configuración** de tarjeta y estaciones
- 📱 **Diseño responsive** optimizado para móviles
- 🎨 **UI moderna** con animaciones suaves
- 🔐 **Autenticación** segura con JWT
- 📸 **Upload de comprobantes** con preview
- 📈 **Gráficas interactivas** con Recharts
- 🌙 **Pull-to-refresh** nativo

## 📋 Requisitos Previos

- **Node.js** 18+ y npm 9+
- **Backend API** funcionando (ver sección de Backend)

## 🛠️ Instalación

### 1. Clonar e Instalar Dependencias

```bash
# Instalar dependencias
npm install
```

### 2. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
cp .env.example .env
```

Edita el archivo `.env`:

```env
# URL de tu backend (sin /api al final)
VITE_API_URL=http://localhost:5000

# Nombre de la aplicación (opcional)
VITE_APP_NAME=Manager Flotilla
```

### 3. Iniciar Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🏗️ Build para Producción

```bash
npm run build
```

Los archivos optimizados estarán en la carpeta `dist/`

### Deploy

Puedes deployar la carpeta `dist/` en cualquier servicio de hosting estático:

- **Vercel**: `vercel --prod`
- **Netlify**: Arrastra la carpeta `dist/`
- **GitHub Pages**: Push a la rama `gh-pages`
- **Servidor propio**: Copia `dist/` al servidor web

## 🔌 Backend API

La aplicación espera que tu backend exponga los siguientes endpoints:

### Autenticación

```
POST   /api/auth/login
POST   /api/auth/register
GET    /api/auth/me
POST   /api/auth/logout
```

### Configuración de Tarjeta

```
GET    /api/config
PUT    /api/config
```

### Estaciones de Gasolina

```
GET    /api/stations
GET    /api/stations/:id
POST   /api/stations
PUT    /api/stations/:id
DELETE /api/stations/:id
```

### Gastos de Combustible

```
GET    /api/expenses
GET    /api/expenses/:id
POST   /api/expenses
PUT    /api/expenses/:id
DELETE /api/expenses/:id
GET    /api/expenses/stats/:cycleId
```

### Upload de Archivos

```
POST   /api/upload
```

### Estructura de Datos Esperada

#### Expense (Gasto)

```json
{
  "id": 1,
  "amount": 1500.00,
  "date": "2024-02-12T00:00:00Z",
  "station_id": 1,
  "station_name": "TotalEnergies Centro",
  "cycle_id": "2024-02",
  "receipt_url": "https://example.com/receipts/abc123.jpg",
  "receipt_image": "abc123.jpg",
  "notes": "Tanque lleno",
  "odometer": 45000,
  "created_at": "2024-02-12T10:30:00Z"
}
```

#### Station (Estación)

```json
{
  "id": 1,
  "name": "TotalEnergies Centro",
  "address": "Av. Winston Churchill, Santo Domingo",
  "zone": "Distrito Nacional",
  "is_active": true
}
```

#### Config (Configuración)

```json
{
  "id": 1,
  "card_name": "Tarjeta Flotilla Manager",
  "monthly_limit": 10000.00,
  "cutoff_start_day": 29,
  "cutoff_end_day": 2,
  "recharge_day": 3,
  "currency": "DOP"
}
```

## 📱 Funcionalidades

### Dashboard

- Tarjeta visual con saldo disponible y % usado
- Alertas automáticas al llegar al 80% y 90%
- Estadísticas rápidas (transacciones, promedio, días al corte)
- Gráfica de consumo acumulado
- Últimos 5 consumos

### Historial

- Filtros por estación, monto, búsqueda
- Agrupación por fecha
- Vista expandible con detalles
- Eliminación de registros
- Exportación a PDF/Print

### Nuevo Gasto

- Formulario validado
- Selección de estación agrupada por zona
- Upload de comprobante con preview
- Validación de monto máximo
- Cálculo automático de ciclo

### Análisis

- Comparativa de últimos 6 ciclos
- Gráfica de barras interactiva
- Cálculo de tendencias (↑↓)
- Detalle de cambio porcentual

### Ajustes

- Configuración de límite mensual
- Días de corte y recarga
- Gestión de estaciones (CRUD)
- Actualización en tiempo real

## 🎨 Tecnologías

- **React 18** - Framework principal
- **React Router** - Navegación
- **TanStack Query** - Gestión de estado servidor
- **React Hook Form** - Formularios
- **Tailwind CSS** - Estilos
- **Framer Motion** - Animaciones
- **Recharts** - Gráficas
- **Lucide React** - Iconos
- **Sonner** - Notificaciones toast
- **date-fns** - Manejo de fechas
- **Radix UI** - Componentes accesibles
- **Vite** - Build tool

## 📁 Estructura del Proyecto

```
src/
├── api/
│   └── apiClient.js          # Cliente HTTP profesional
├── components/
│   ├── ui/                   # Componentes base (shadcn)
│   ├── dashboard/            # Componentes del dashboard
│   ├── history/              # Componentes del historial
│   ├── expense/              # Componentes de gastos
│   ├── settings/             # Componentes de ajustes
│   ├── analytics/            # Componentes de análisis
│   └── shared/               # Componentes compartidos
├── hooks/
│   └── use-mobile.jsx        # Hook de detección mobile
├── lib/
│   ├── AuthContext.jsx       # Contexto de autenticación
│   ├── query-client.js       # Cliente React Query
│   └── utils.js              # Utilidades
├── pages/
│   ├── Dashboard.jsx
│   ├── History.jsx
│   ├── NewExpense.jsx
│   ├── Settings.jsx
│   ├── Analytics.jsx
│   └── Login.jsx
├── utils/
│   └── index.js              # Funciones auxiliares
├── App.jsx                   # Componente raíz
├── Layout.jsx                # Layout con navegación
├── main.jsx                  # Entry point
├── pages.config.js           # Configuración de rutas
└── index.css                 # Estilos globales
```

## 🔒 Autenticación

La aplicación maneja autenticación mediante JWT tokens:

1. El token se almacena en `localStorage` como `auth_token`
2. Se incluye automáticamente en cada request (header `Authorization: Bearer {token}`)
3. Si el token expira (401), redirige al login automáticamente
4. El usuario puede hacer logout manualmente

## 🌐 Proxy de Desarrollo

El servidor de desarrollo incluye un proxy para evitar problemas de CORS:

```javascript
// vite.config.js
proxy: {
  "/api": {
    target: process.env.VITE_API_URL || "http://localhost:5000",
    changeOrigin: true,
  },
}
```

## 🐛 Troubleshooting

### Error: "Sesión expirada"

- El token JWT ha expirado
- Solución: Vuelve a iniciar sesión

### Error: "Network Error" o "CORS"

- Verifica que el backend esté corriendo
- Confirma que `VITE_API_URL` apunte correctamente
- Revisa la configuración CORS del backend

### Las imágenes no cargan

- Verifica que el backend retorne URLs completas o rutas relativas correctas
- Revisa la función `apiClient.getImageUrl()`

### Build falla

```bash
# Limpia caché y reinstala
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📝 Scripts Disponibles

```bash
npm run dev      # Desarrollo con hot-reload
npm run build    # Build de producción
npm run preview  # Preview del build
npm run lint     # Linter (ESLint)
```

## 🤝 Contribuciones

Este es un proyecto privado. Para contribuir:

1. Crea una rama feature: `git checkout -b feature/nueva-funcionalidad`
2. Commit tus cambios: `git commit -m 'Añade nueva funcionalidad'`
3. Push a la rama: `git push origin feature/nueva-funcionalidad`
4. Abre un Pull Request

## 📄 Licencia

© 2024 Manager Flotilla. Todos los derechos reservados.

## 👨‍💻 Soporte

Para soporte técnico o consultas:

- Email: <soporte@example.com>
- Documentación: [Link a docs]

---

**Desarrollado con ❤️ para Clientes**
