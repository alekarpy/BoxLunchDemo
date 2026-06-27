# BoxLunch — Sistema de Gestión de Pedidos

> **Proyecto real, versión portafolio.**
> Este sistema fue desarrollado e implementado en producción para una empresa real, integrando **Microsoft Graph API**, **Microsoft Entra ID (Azure AD)** y usuarios corporativos activos. Esta versión en GitHub es una adaptación personal para demostrar el stack tecnológico completo con datos simulados, sin dependencias de la infraestructura empresarial original.

## 🏭 Versión de Producción vs. Versión Demo

| | Producción (empresa) | Demo (este repo) |
|---|---|---|
| **Autenticación** | Microsoft Entra ID (OIDC) | Mock Login por roles |
| **Directorio de usuarios** | Microsoft Graph API | Datos simulados |
| **Base de datos** | SQL Server | SQLite |
| **Fotos de perfil** | Azure AD (Graph API) | randomuser.me |
| **Despliegue** | IIS / Servidor corporativo | Railway |

---

## 🛠 Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Backend** | .NET 10, ASP.NET Core, Entity Framework Core |
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS |
| **Base de Datos** | SQLite (demo) / SQL Server (producción) |
| **Auth (Demo)** | Mock Login por roles |
| **Auth (Producción)** | Microsoft Entra ID (OIDC) + Microsoft Graph API |
| **Despliegue** | Railway + Cloudflare (dominio) |

---

## 🎭 Roles del Sistema

El sistema cuenta con **3 roles** que puedes explorar en la demo:

| Rol | Usuario | Descripción |
|---|---|---|
| **Administrador** | `admin@demo.com` | Gestión completa de pedidos y empleados |
| **Operativo** | `operativo@demo.com` | Recibe alertas de nuevos pedidos en tiempo real |
| **Desarrollador** | `desarrollador@demo.com` | Acceso técnico + gestión de roles de usuario |

## 💾 Persistencia y Auto-limpieza de Datos (Modo Demo)

Para garantizar una experiencia de prueba y navegación óptima, la base de datos de esta versión demo funciona bajo las siguientes pautas:
- **Guardado inmediato:** Todos los cambios que realices (crear nuevos pedidos, reasignar roles de usuario, etc.) se escriben y guardan en la base de datos de inmediato, manteniéndose activos durante tu sesión.
- **Auto-restablecimiento (Seed):** Con cada nuevo despliegue o reinicio del contenedor en Railway, la base de datos SQLite se limpia y se vuelve a sembrar (*seed*) con los datos iniciales óptimos (100 empleados simulados y 100 pedidos históricos con fechas coherentes). Esto previene la acumulación de datos de prueba incompletos y garantiza que el sistema siempre se presente con un aspecto impecable, ordenado y profesional.

---

## 🚀 Correr Localmente

### Requisitos
- .NET 10 SDK
- Node.js 18+

### Backend (`BoxLunch.API`)

```bash
cd BoxLunch.API
# Copia el template de configuración
cp appsettings.example.json appsettings.Development.json
dotnet run
```

> El sistema detecta automáticamente que no hay credenciales de Azure AD y activa el **Modo Demo** con los 3 usuarios de prueba listos para usar.

### Frontend

```bash
npm install
npm run dev
```

La app estará disponible en `http://localhost:5173/boxlunch/`

---

## ⚙️ Variables de Entorno (Railway / Producción)

### Backend
| Variable | Descripción |
|---|---|
| `ConnectionStrings__DefaultConnection` | Cadena de conexión SQLite (ej: `Data Source=/data/boxlunch.db`) |
| `FrontendOrigin` | URL del frontend desplegado (ej: `https://boxlunch.alekarpy.uk`) |

### Frontend
| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL del backend (ej: `https://api-boxlunch.up.railway.app/api`) |

---

## 🔐 Activar Autenticación Real (Microsoft Entra ID)

Para conectar con el directorio corporativo real, configura en `BoxLunch.API/appsettings.json`:

```json
{
  "AzureAd": {
    "TenantId": "TU_TENANT_ID",
    "ClientId": "TU_CLIENT_ID",
    "ClientSecret": "TU_CLIENT_SECRET",
    "Domain": "tu-empresa.com"
  }
}
```

Y registra estas URIs de redirección en el portal de Azure:
- `https://TU_DOMINIO/boxlunch/signin-oidc`
