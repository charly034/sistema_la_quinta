# Arquitectura

## Objetivo

Centralizar La Quinta y Fit & Fresh en un monorepo con una sola API y una sola base de datos, manteniendo frontends separados por marca, una web central interna y una web de administracion especializada.

## Capas

### apps/api

- Expone la API central.
- Mantiene las rutas actuales bajo `/api/v1`.
- Debe concentrar integraciones externas, reglas de negocio y acceso a datos.

### apps/web-administracion

- App interna especializada para adelantos.
- Mantiene el flujo actual de registro y gestion de adelantos.

### apps/web-central

- Base del panel interno central del sistema.
- Punto natural para consolidar pedidos, clientes, productos, reportes, produccion y entregas.

### apps/web-pedidos-la-quinta

- App web operativa para visualizar pedidos de La Quinta.
- Consume la API central con foco en el flujo actual de pedidos.

### apps/web-la-quinta

- Web publica institucional de La Quinta.
- Consume la API central con branding propio.

### apps/web-fit-and-fresh

- Web publica de Fit & Fresh.
- Puede iniciar con catalogo, estado de pedidos y contacto, mientras los pedidos entran por Google Forms.

### packages

- `shared-types`: DTOs, enums y contratos entre front y back.
- `ui`: componentes comunes para webs internas y publicas.
- `config`: configuracion de marcas, endpoints y despliegue.

## Modulos esperados en la API

```text
apps/api/src/modules/
├── orders/
├── customers/
├── products/
├── brands/
├── google-forms/
├── labels/
├── reports/
├── delivery/
├── production/
└── payments/
```

## Rutas futuras propuestas

```text
/api/orders
/api/customers
/api/products
/api/brands
/api/google-forms
/api/labels
/api/reports
/api/delivery
/api/production
/api/payments
```

## Estrategia de evolucion

1. Mantener compatibilidad con `/api/v1` para no romper clientes actuales.
2. Introducir nuevos modulos en ingles dentro de `apps/api/src/modules`.
3. Cuando convenga, agregar un gateway o versionado que permita convivir rutas legacy y nuevas.
4. Compartir contratos y configuraciones desde `packages/` para evitar duplicacion.

## Marcas

- La Quinta: pedidos directos, menu, produccion, etiquetas y entregas.
- Fit & Fresh: pedidos desde Google Forms, procesados por la API central y la misma base de datos.
