# Base de datos

## Modelo operativo

Una sola base de datos central para todas las marcas y canales.

## Principios

1. Compartir clientes, productos, catalogos base y estados operativos.
2. Separar marca y canal en el modelo de datos para filtrar reporting y operacion.
3. Mantener trazabilidad del origen del pedido: web propia, admin, Google Forms, carga manual.

## Entidades funcionales esperadas

- `brands`
- `customers`
- `products`
- `orders`
- `order_items`
- `payments`
- `deliveries`
- `labels`
- `production_batches`
- `reports_snapshots`
- `google_forms_submissions`

## Campos transversales recomendados

- `brand_id`
- `source_channel`
- `status`
- `created_at`
- `updated_at`

## Recomendacion de evolucion

1. Mantener la tabla legacy de pedidos operativa.
2. Introducir nuevas tablas con nomenclatura estable en ingles.
3. Resolver compatibilidad con vistas SQL o capa de repositorio mientras convivan legacy y nuevo.
