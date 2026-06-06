# La Quinta Comidas - Gestión de Pedidos

Una aplicación web para gestionar pedidos de comida de La Quinta Comidas. Permite visualizar, filtrar y actualizar el estado de los pedidos en tiempo real.

## 🚀 Características

- **Visualización de pedidos**: Muestra todos los pedidos con información detallada (cliente, productos, dirección, etc.)
- **Estados de pedidos**: Gestiona tres estados: pendiente, preparado y finalizado
- **Filtros inteligentes**:
  - Filtrar por fecha (solo hoy o todos los pedidos)
  - Ocultar pedidos finalizados por defecto
  - Toggle para mostrar/ocultar pedidos finalizados
- **Actualización en tiempo real**: Auto-refresh cada 15 segundos
- **Impresión de tickets**: Genera tickets de 80mm para impresión
- **Integración con WhatsApp**: Envía mensajes directos a los clientes
- **Interfaz responsive**: Optimizada para diferentes tamaños de pantalla

## 🛠️ Tecnologías

- **Frontend**: React 19 + Vite
- **Estilos**: CSS personalizado
- **Impresión**: react-to-print
- **API**: Fetch API para comunicación con backend

## 📦 Instalación

1. Clona el repositorio:

```bash
git clone <url-del-repositorio>
cd laquinta-web
```

2. Instala las dependencias:

```bash
npm install
```

3. Inicia el servidor de desarrollo:

```bash
npm run dev
```

4. Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

## 🏗️ Construcción para producción

```bash
npm run build
```

Los archivos de producción estarán en la carpeta `dist/`.

## 🚀 Despliegue

La aplicación está configurada para despliegue con:

- **Caddy**: Archivo `Caddyfile` incluido
- **Nginx**: Archivo `nginx.conf` incluido
- **Nixpacks**: Archivo `nixpacks.toml` para despliegue en plataformas como Railway

## 📁 Estructura del proyecto

```
src/
├── components/
│   ├── HeaderControls.jsx    # Controles de filtros y configuración
│   ├── PedidoCard.jsx        # Tarjeta individual de pedido
│   ├── PedidosList.jsx       # Lista de pedidos con estados
│   └── Footer.jsx            # Footer de la aplicación
├── hooks/
│   ├── usePedidos.js         # Hook para gestión de pedidos
│   └── useFilteredPedidos.js # Hook para filtros de pedidos
├── services/
│   └── pedidosApi.js         # API calls para pedidos
├── utils/
│   ├── dates.js              # Utilidades de fechas
│   ├── pedido.js             # Utilidades de pedidos
│   ├── text.js               # Utilidades de texto
│   └── whatsapp.js           # Utilidades de WhatsApp
├── printing/
│   ├── printTicket.js        # Lógica de impresión
│   ├── ticket80mm.js         # Template de ticket
│   └── useTicketPrint.js     # Hook de impresión
└── assets/                   # Recursos estáticos
```

## 🎯 Uso

### Gestión de pedidos

- Los pedidos se cargan automáticamente cada 15 segundos
- Usa el toggle "Solo hoy" para filtrar pedidos del día actual
- Los pedidos finalizados se ocultan por defecto; usa "Mostrar finalizados" para verlos

### Estados de pedidos

- **Pendiente** (amarillo): Estado inicial
- **Preparado** (azul): Pedido listo para entrega/retiro
- **Finalizado** (verde): Pedido completado

### Acciones disponibles

- **🔄 Toggle**: Cambia entre pendiente y preparado
- **✅ Finalizar**: Marca el pedido como finalizado
- **🖨️ Imprimir**: Genera ticket de impresión
- **📋 Copiar**: Copia detalles del pedido (función removida)
- **💬 WhatsApp**: Abre chat con el cliente

## 🔧 Configuración

### API Endpoint

La aplicación se conecta a la API en `https://api.iamdz.cloud`. Para cambiar el endpoint, modifica `src/services/pedidosApi.js`.

### Auto-refresh

El intervalo de auto-refresh se configura en `src/App.jsx` (15 segundos por defecto).

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y propiedad de La Quinta Comidas.

## 📞 Soporte

Para soporte técnico, contacta al equipo de desarrollo.
