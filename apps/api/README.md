# La Quinta - API

Pequeña API Express con conexión a PostgreSQL. Soporta conexión local y remota y detecta automáticamente el modo.

Ahora la API está modularizada por dominios para que puedas agregar funcionalidades nuevas sin mezclar todo en un solo archivo.

**Estructura actual**

```text
.
├── index.js
├── src
│   ├── app.js
│   ├── config
│   │   └── db.js
│   ├── middlewares
│   │   ├── error.middleware.js
│   │   └── validate.middleware.js
│   ├── routes
│   │   └── index.js
│   ├── utils
│   │   ├── api-error.js
│   │   └── http.js
│   └── modules
│       ├── pedidos
│       │   ├── pedidos.controller.js
│       │   ├── pedidos.routes.js
│       │   └── pedidos.schemas.js
│       └── system
│           └── system.routes.js
└── README.md
```

**Qué hace cada capa**

- `index.js`: arranque del servidor y shutdown ordenado.
- `src/app.js`: instancia Express + middlewares globales.
- `src/config/db.js`: inicialización, config y cierre de PostgreSQL.
- `src/middlewares/error.middleware.js`: 404 + manejo global de errores.
- `src/middlewares/validate.middleware.js`: validación de requests con Zod.
- `src/routes/index.js`: agrega todos los routers de módulos.
- `src/modules/<modulo>/`: rutas y controladores por dominio.
- `src/utils/`: utilidades compartidas (errores HTTP, helpers, etc.).

**Requisitos**

- Node.js 18+ (probado con Node 22)
- PostgreSQL (local o remoto)

**Instalación**

```bash
npm install
```

**Scripts**

- `npm run dev` — arranca con `nodemon` (recomendado durante desarrollo)
- `npm start` — arranca con `node index.js`

**Cómo agregar un módulo nuevo (ejemplo: clientes)**

1. Crear carpeta `src/modules/clientes`.
2. Crear `clientes.controller.js` con la lógica de negocio.
3. Crear `clientes.routes.js` con endpoints (`Router`).
4. Registrar el router en `src/routes/index.js`.

Ejemplo mínimo:

```js
// src/modules/clientes/clientes.routes.js
import { Router } from "express";

const router = Router();

router.get("/clientes", (_req, res) => {
  res.json({ ok: true, data: [] });
});

export default router;
```

```js
// src/routes/index.js
import { Router } from "express";
import pedidosRoutes from "../modules/pedidos/pedidos.routes.js";
import systemRoutes from "../modules/system/system.routes.js";
import clientesRoutes from "../modules/clientes/clientes.routes.js";

const router = Router();
router.use(systemRoutes);
router.use(pedidosRoutes);
router.use(clientesRoutes);

export default router;
```

**Variables de entorno**

La app carga `.env` (usa `dotenv`). Variables principales:

- `DATABASE_URL` — URL completa de conexión PostgreSQL. (Ej: `postgres://user:pass@host:5432/dbname?sslmode=require`)
- `DB_HOST` — host de la BD (ej `localhost` o `mi-host.com`)
- `DB_PORT` — puerto (por defecto `5432`)
- `DB_NAME` — nombre de la base de datos
- `DB_USER` — usuario
- `DB_PASSWORD` — contraseña
- `DB_SSL` — forzar SSL (`1`, `true`, `yes`) o `false` para desactivar
- `DB_FORCE_LOCAL` — si `1` fuerza usar la configuración local
- `DB_FORCE_REMOTE` — si `1` fuerza usar la configuración remota
- `NODE_ENV` — `development` o `production`. Por defecto la app prioriza local; la remota se usa automáticamente sólo si `NODE_ENV=development` (a menos que se fuerce)
- `PORT` — puerto de la app (por defecto `3000`)

Ejemplo mínimo de `.env`:

```dotenv
# Conexion por DATABASE_URL (remota)
DATABASE_URL=postgres://usuario:password@193.203.174.156:5432/laquinta_DB?sslmode=disable

# O configuración por partes (local)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=laquinta_DB
DB_USER=usuario_local
DB_PASSWORD=pass_local
DB_SSL=false

PORT=3000
```

**Comportamiento de detección local vs remota**

- La app prioriza la BD local en entornos no `development` (producción) para evitar usar la remota accidentalmente.
- Si `NODE_ENV=development` y existe `DATABASE_URL` o un `DB_HOST` que no sea `localhost`/`127.0.0.1`, la app usará la remota.
- Podés forzar comportamiento con `DB_FORCE_LOCAL=1` o `DB_FORCE_REMOTE=1`.
- SSL se detecta desde `DB_SSL` o desde la presencia de `DATABASE_URL`/host remoto; también puede forzarse con `DB_SSL=1`.

**Versionado de API**

- Base de API: `/api/v1`
- Healthchecks de infraestructura: `/` y `/health` (sin versionar)

**Endpoints**

- GET `/` — health simple (200 OK)
- GET `/health` — `{ ok: true }`
- GET `/api/v1/db` — prueba rápida a la BD, devuelve `{ ok: true, db: 1 }` si funciona
- GET `/api/v1/pedidos` — obtiene los últimos 100 pedidos
- POST `/api/v1/pedidos` — crea un pedido
- GET `/api/v1/pedidos/:id` — obtiene pedido por id
- PUT `/api/v1/pedidos/:id/estado` — actualiza el estado de un pedido
- POST `/api/v1/setup` — crea la tabla `pedidos` si no existe (útil para debug)

**Validaciones con Zod (pedidos)**

- `POST /api/v1/pedidos` valida body (id, fecha `DD/MM/YYYY`, hora `HH:mm` o `HH:mm:ss`, telefono, nombre, modalidad, productos).
- `GET /api/v1/pedidos/:id` valida `:id`.
- `PUT /api/v1/pedidos/:id/estado` valida `:id` y `estado`.
- Si falla la validación, responde `400` con `code: "VALIDATION_ERROR"` y detalle de campos.

**Comandos de prueba**

PowerShell:

```powershell
# Probar health
wget -UseBasicParsing -Uri http://localhost:3000/

# Probar /db
wget -UseBasicParsing -Uri http://localhost:3000/db -OutFile -
```

Linux/macOS (curl):

```bash
curl http://localhost:3000/db
```

**Notas y troubleshooting**

- Asegurate de que el `.env` esté presente y con las credenciales correctas.
- Si la app falla por `Cannot find package 'dotenv'`, ejecuta `npm i dotenv`.
- Si quieres ver si la app está usando la BD local o remota, revisa los logs al arrancar; el arranque informa `Priorizando DB local` o `Usando DB remota` y muestra la configuración (sin password).
- Para forzar reconexiones o reintentos automáticos, se puede mejorar el código adicionando lógica de reintento/expBackoff (no incluido por defecto).

**Contribuir / Cambios**

Si querés que agregue:

- Endpoint que devuelva explícitamente `mode: "local"|"remote"`.
- Reintentos automáticos de conexión.
- Tests unitarios o integración.

Abrí un issue o pedime que lo implemente y lo agrego.

---

Archivo principal: [index.js](index.js)
