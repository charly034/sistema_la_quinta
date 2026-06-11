# La Quinta - API

API Express modular con PostgreSQL, autenticación JWT, refresh tokens opacos con hash, CORS por allowlist, Swagger y migraciones con `node-pg-migrate`.

## Estado actual

- La base de versionado es `/api/v1`.
- Swagger UI está disponible en `/api/v1/documentacion`.
- El endpoint `/api/v1/pedidos/setup` ya no existe.
- Los endpoints nuevos están protegidos explícitamente.
- Los endpoints legacy de pedidos siguen montados por compatibilidad.

## Requisitos

- Node.js 22 o superior.
- PostgreSQL para migraciones y ejecución real.
- Variables de entorno locales o una `DATABASE_URL` de pruebas.

## Variables de entorno

Usar `apps/api/.env.example` como plantilla. Variables principales:

- `NODE_ENV`
- `PORT`
- `DATABASE_URL` o `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD`
- `DB_SSL`
- `CORS_ORIGENES_PERMITIDOS`
- `JWT_SECRETO_ACCESO` (obligatoria en runtime)
- `JWT_DURACION_ACCESO`
- `DURACION_REFRESH_TOKEN`
- `COSTO_HASH_CONTRASENA`
- `RATE_LIMIT_AUTENTICACION_VENTANA_MS`
- `RATE_LIMIT_AUTENTICACION_MAXIMO`
- `AUDITORIA_HABILITADA`

## Scripts

Desde `apps/api`:

```bash
npm run dev
npm start
npm test
npm run migrar:subir
npm run migrar:bajar
npm run migrar:estado
npm run migrar:crear
npm run inicializar:datos
npm run crear:propietario
npm run limpiar:sesiones-vencidas
```

## Migraciones

Las migraciones están en `apps/api/migrations/`.

La tabla oficial de control de migraciones es `pgmigrations`.

Datos aprobados para esta etapa:

- Marca `LA_QUINTA`.
- Canales `LOCAL`, `EMPRESAS`, `UNIVERSIDAD` y `VENTA_ONLINE`.
- Opciones `A` y `C` para la marca La Quinta.
- Roles y permisos estructurales.

No se crea una empresa de ejemplo en esta etapa.

## Endpoints principales

- `GET /` y `GET /health`: healthchecks.
- `GET /api/v1/documentacion`: Swagger UI.
- `POST /api/v1/autenticacion/iniciar-sesion`
- `POST /api/v1/autenticacion/renovar-sesion`
- `POST /api/v1/autenticacion/cerrar-sesion`
- `POST /api/v1/autenticacion/cambiar-contrasena`
- `GET /api/v1/autenticacion/mi-perfil`
- `GET|POST|PATCH|PUT /api/v1/usuarios...`
- `GET|POST|PATCH|PUT /api/v1/roles...`
- `GET /api/v1/permisos`
- `GET /api/v1/auditoria`
- `GET|POST|PATCH /api/v1/marcas...`
- `GET|POST|PATCH /api/v1/canales...`
- `GET|POST|PATCH /api/v1/empresas...`
- `GET|POST|PATCH|PUT /api/v1/menu/opciones...`
- `GET|POST|PATCH|PUT /api/v1/menu/platos...`
- `GET|POST|PATCH /api/v1/menu/categorias...`
- `GET|POST|PATCH /api/v1/menu/proteinas...`
- `GET|POST|PATCH /api/v1/menu/etiquetas...`
- `GET|POST|PATCH /api/v1/menu/ingredientes...`
- `GET|POST|PATCH /api/v1/menu/alergenos...`
- `GET|POST|PATCH /api/v1/menu/caracteristicas-alimentarias...`
- `GET|POST|PUT /api/v1/pedidos...` legacy

## Seguridad

- `helmet` activo.
- CORS restringido por lista de orígenes.
- Rate limiting solo en autenticación.
- Access tokens JWT de corta duración.
- Refresh tokens opacos con hash y rotación.

## Pruebas

Pruebas reales agregadas en:

- `src/utils/seguridad.test.js`
- `src/utils/transacciones.test.js`
- `src/config/cors.test.js`
- `src/modules/autenticacion/autenticacion.utilidades.test.js`
- `src/modules/auditoria/auditoria.utilidades.test.js`
- `src/middlewares/autenticacion.middleware.test.js`

Resultado verificado:

- `npm test` ejecuta 18 pruebas y pasa.

Las pruebas de integración contra PostgreSQL de pruebas siguen pendientes porque en esta sesión no hubo una base descartable disponible.

## Notas operativas

- `npm audit` todavía reporta vulnerabilidades en dependencias de desarrollo/CLI.
- No usar `npm audit fix --force` sin revisar compatibilidad.
