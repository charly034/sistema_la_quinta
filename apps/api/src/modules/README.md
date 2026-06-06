# Modulos de negocio

La API conserva hoy los modulos legacy `pedidos` y `system`, y queda preparada para evolucionar hacia modulos nuevos con nomenclatura estable:

- `orders`
- `customers`
- `products`
- `brands`
- `google-forms`
- `labels`
- `reports`
- `delivery`
- `production`
- `payments`

Estos modulos todavia no se montan en runtime para no alterar el comportamiento actual. La referencia de integracion inicial queda en `src/routes/future-modules.example.js`.
