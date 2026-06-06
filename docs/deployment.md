# Despliegue

## Objetivo

Permitir despliegue independiente de cada app:

- API
- Web Administracion
- Web Central
- Web Pedidos La Quinta
- Web La Quinta
- Web Fit & Fresh

## VPS con PM2 y Nginx

Activos preparados en el repositorio:

- `deploy/pm2/ecosystem.config.js`
- `deploy/nginx/api.laquinta.conf.example`
- `deploy/nginx/web-administracion.conf.example`
- `deploy/nginx/web-central.conf.example`
- `deploy/nginx/web-pedidos-la-quinta.conf.example`
- `deploy/nginx/web-la-quinta.conf.example`
- `deploy/nginx/web-fit-and-fresh.conf.example`

### API

- Directorio: `apps/api`
- Inicio: `npm run start:api`
- PM2: `pm2 start deploy/pm2/ecosystem.config.js --only la-quinta-api`
- Reverse proxy recomendado desde Nginx a `http://127.0.0.1:3000`

### Web Administracion

- Build: `npm run build:web-administracion`
- Opcion 1: servir `apps/web-administracion/dist` con Nginx.
- Opcion 2: `pm2 start deploy/pm2/ecosystem.config.js --only la-quinta-web-administracion-preview` para preview controlado por PM2.

### Web Central

- Build: `npm run build:web-central`
- Servir `apps/web-central/dist` con Nginx.
- Preview opcional: `pm2 start deploy/pm2/ecosystem.config.js --only la-quinta-web-central-preview`

### Web Pedidos La Quinta

- Build: `npm run build:web-pedidos-la-quinta`
- Servir `apps/web-pedidos-la-quinta/dist` con Nginx.
- Preview opcional: `pm2 start deploy/pm2/ecosystem.config.js --only la-quinta-web-pedidos-preview`

### Web La Quinta

- Build: `npm run build:web-la-quinta`
- Servir `apps/web-la-quinta/dist` con Nginx.
- Preview opcional: `pm2 start deploy/pm2/ecosystem.config.js --only la-quinta-web-preview`

### Web Fit & Fresh

- Build: `npm run build:web-fit-and-fresh`
- Servir `apps/web-fit-and-fresh/dist` con Nginx.
- Preview opcional: `pm2 start deploy/pm2/ecosystem.config.js --only fit-and-fresh-web-preview`

## Flujo recomendado para VPS

1. Ejecutar `npm install` y `npm run build` desde la raiz.
2. Levantar API con PM2 usando `deploy/pm2/ecosystem.config.js`.
3. Copiar una plantilla desde `deploy/nginx/`, ajustar dominio y rutas, y habilitar el sitio en Nginx.
4. Para frontends, servir siempre `dist/` con Nginx salvo que necesites un preview temporal con PM2.

## Railway o Render

### API

- Root Directory: `apps/api`
- Build Command: `npm install`
- Start Command: `npm start`

### Webs internas y publicas

- Root Directory: `apps/web-administracion`, `apps/web-central`, `apps/web-pedidos-la-quinta`, `apps/web-la-quinta` o `apps/web-fit-and-fresh`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`

## Variables de entorno recomendadas

- API: `PORT`, `DATABASE_URL`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL`
- Webs internas y publicas: `VITE_API_URL`

## Recomendacion operativa

Separar los despliegues por app para poder actualizar una marca o una web interna sin tocar la API ni el resto de frontends.
