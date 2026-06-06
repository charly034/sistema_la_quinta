# Deploy assets

Este directorio agrupa configuraciones operativas listas para adaptar en un VPS.

## PM2

- Archivo principal: `pm2/ecosystem.config.js`
- Incluye una app para la API y cinco previews opcionales para las webs operativas y publicas.
- Recomendacion productiva: usar PM2 obligatorio para la API y Nginx sirviendo los `dist/` de los frontends.

## Nginx

- `nginx/api.laquinta.conf.example`
- `nginx/web-administracion.conf.example`
- `nginx/web-central.conf.example`
- `nginx/web-pedidos-la-quinta.conf.example`
- `nginx/web-la-quinta.conf.example`
- `nginx/web-fit-and-fresh.conf.example`

Cada archivo es una plantilla base. Ajusta `server_name`, rutas `root` y certificados TLS segun el VPS.
