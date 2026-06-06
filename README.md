# La Quinta System

Monorepo preparado para operar una API central, una web central interna, una web de administracion para adelantos y frontends publicos separados por marca dentro del mismo negocio.

## Estructura activa

```text
.
├── apps/
│   ├── api/
│   ├── web-administracion/
│   ├── web-central/
│   ├── web-pedidos-la-quinta/
│   ├── web-la-quinta/
│   └── web-fit-and-fresh/
├── packages/
│   ├── shared-types/
│   ├── ui/
│   └── config/
└── docs/
```

## Apps

- `apps/api`: API central existente de La Quinta, preparada para crecer por modulos.
- `apps/web-administracion`: app actual para anotar y gestionar adelantos.
- `apps/web-central`: base del panel interno central del sistema.
- `apps/web-pedidos-la-quinta`: app actual para visualizar pedidos de La Quinta.
- `apps/web-la-quinta`: frontend publico institucional reservado para otro uso.
- `apps/web-fit-and-fresh`: frontend publico base para Fit & Fresh.

## Packages

- `packages/shared-types`: contratos y tipos compartidos entre apps.
- `packages/ui`: componentes reutilizables entre webs internas y publicas.
- `packages/config`: configuraciones compartidas de entorno, marcas y despliegue.

## Comandos de trabajo

Primero instala dependencias desde la raiz:

```bash
npm install
```

Luego puedes operar cada app por separado:

```bash
npm run dev:api
npm run dev:web-administracion
npm run dev:web-central
npm run dev:web-pedidos-la-quinta
npm run dev:web-la-quinta
npm run dev:web-fit-and-fresh
```

Build por app:

```bash
npm run build:api
npm run build:web-administracion
npm run build:web-central
npm run build:web-pedidos-la-quinta
npm run build:web-la-quinta
npm run build:web-fit-and-fresh
```

Arranque individual:

```bash
npm run start:api
npm run start:web-administracion
npm run start:web-central
npm run start:web-pedidos-la-quinta
npm run start:web-la-quinta
npm run start:web-fit-and-fresh
```

## Notas de migracion

- La estructura nueva y soportada vive en `apps/`, `packages/` y `docs/`.
- La migracion activa ya quedo consolidada sobre `apps/`, que pasa a ser la unica estructura soportada.
- La API activa se ejecuta desde `apps/api` sin modificar sus rutas existentes.

## API central

La API mantiene el comportamiento actual bajo `/api/v1` y queda preparada para evolucionar hacia modulos como:

- `/api/orders`
- `/api/customers`
- `/api/products`
- `/api/brands`
- `/api/google-forms`
- `/api/labels`
- `/api/reports`
- `/api/delivery`
- `/api/production`
- `/api/payments`

La propuesta arquitectonica y de despliegue esta documentada en `docs/`.

## Assets de despliegue

- `deploy/pm2/ecosystem.config.js`: procesos base para PM2.
- `deploy/nginx/*.example`: plantillas de virtual hosts por app para Nginx.
