# Módulo de Menús Semanales - Etapa 3

Implementación completa del sistema de menús semanales para gestionar semanas de comidas, versiones, días, opciones de platos, exportaciones e importaciones.

## Estructura del Módulo

```
apps/api/src/modules/menu/
├── menus-semanales/
│   ├── menus-semanales.constantes.js      # Máquina de estados y permisos
│   ├── menus-semanales.utilidades.js      # Funciones de fechas y días
│   ├── menus-semanales.validaciones.js    # Esquemas Zod
│   ├── menus-semanales.repositorio.js     # Queries SQL parametrizadas
│   ├── menus-semanales.servicio.js        # Lógica de negocio
│   ├── menus-semanales.controlador.js     # Endpoints HTTP
│   ├── menus-semanales.rutas.js           # Router Express
│   └── pruebas/
│       └── menus-semanales.pruebas.test.js
├── plantillas-menus/
│   └── plantillas-menus.servicio.js       # Gestión de plantillas
├── exportaciones-menus/
│   └── exportaciones-menus.servicio.js    # Exportar a texto/Excel
└── importaciones-menus/
    └── importaciones-menus.servicio.js    # Importar JSON con validaciones
```

## Características Implementadas

### 1. Gestión de Semanas

- ✅ Crear semana lógica (lunes-domingo)
- ✅ Validación de contexto único (marca + canal + empresa + fecha)
- ✅ Creación automática de 7 días
- ✅ Listar semanas con filtros
- ✅ Obtener semana completa con versiones y días
- ✅ Duplicar semana con clonación de contenido

### 2. Versionado

- ✅ Crear nuevas versiones a partir de existentes
- ✅ Preservar versión publicada mientras existe borrador
- ✅ Máquina de estados (BORRADOR → PROPUESTO → APROBADO → PUBLICADO → FINALIZADO)
- ✅ Transiciones válidas/inválidas con validación
- ✅ Historial completo de versiones

### 3. Gestión de Días y Opciones

- ✅ 7 días automáticos por semana
- ✅ Estados de día (DIA_LABORAL, FERIADO, CERRADO, SIN_CONFIGURAR)
- ✅ Asignar platos a opciones menú
- ✅ Validación: no repetir plato en la semana
- ✅ Opciones con códigos variables (A, B, C, D, etc.)
- ✅ Feriados y cerrados sin opciones obligatorias

### 4. Plantillas y WhatsApp

- ✅ Crear plantillas por marca/canal/empresa
- ✅ Variables en plantilla: {{rango_semana}}, {{contenido_dias}}, etc.
- ✅ Selección automática por contexto
- ✅ Configuración por tipo de mensaje

### 5. Exportaciones

- ✅ Exportar a texto (formato legible)
- ✅ Exportar a Excel con estilos y formato
- ✅ Incluir días, estados, opciones y observaciones
- ✅ Nombres de archivo con fecha y marca

### 6. Importaciones

- ✅ Importar JSON con estructura validada
- ✅ Modo simulación (dry-run sin cambios)
- ✅ Detección de conflictos
- ✅ Estrategias: ERROR, OMITIR, CREAR_VERSION
- ✅ Detección de archivo duplicado (hash MD5)
- ✅ Transacciones: todo o nada
- ✅ Rollback ante error

### 7. Historial

- ✅ Historial de versiones por semana
- ✅ Historial de uso de plato (sin duplicar)
- ✅ Auditoría de cambios

### 8. Permisos

- ✅ MENUS_LEER: Ver menús
- ✅ MENUS_GESTIONAR: Crear/editar versiones
- ✅ MENUS_APROBAR: Aprobar versiones
- ✅ MENUS_PUBLICAR: Publicar versiones
- ✅ MENUS_EXPORTAR: Exportar menús
- ✅ MENUS_IMPORTAR: Importar JSON

## Endpoints HTTP

### Semanas

```
GET    /menus-semanales                    Listar semanas
POST   /menus-semanales                    Crear semana
GET    /menus-semanales/:semanaId          Obtener semana completa
GET    /menus-semanales/:semanaId/historial-versiones
POST   /menus-semanales/:semanaId/versiones
POST   /menus-semanales/versiones/:versionId/transicionar
POST   /menus-semanales/versiones/:versionId/opciones
GET    /menus-semanales/platos/:platoId/historial
POST   /menus-semanales/duplicar
POST   /menus-semanales/exportar
POST   /menus-semanales/importar
```

## Ejemplos de Uso

### Crear Semana

```bash
POST /menus-semanales
{
  "marcaId": "123e4567-e89b-12d3-a456-426614174000",
  "canalId": null,
  "empresaId": null,
  "fechaInicio": "2026-06-15",  # Debe ser lunes
  "fechaFin": "2026-06-21"       # Debe ser domingo
}
```

### Crear Nueva Versión

```bash
POST /menus-semanales/:semanaId/versiones
{
  "observaciones": "Segunda revisión",
  "motivoCambio": "Cambios en platos",
  "semanaId": "..."
}
```

### Transicionar Estado

```bash
POST /menus-semanales/versiones/:versionId/transicionar
{
  "estadoNuevo": "APROBADO",
  "motivo": "Revisado y aprobado"
}
```

### Asignar Plato

```bash
POST /menus-semanales/versiones/:versionId/opciones
{
  "diaId": "...",
  "opcionMenuMarcaId": "...",
  "platoId": "..."
}
```

### Duplicar Semana

```bash
POST /menus-semanales/duplicar
{
  "semanaOrigenId": "...",
  "fechaInicio": "2026-06-22"  # Nueva semana
}
```

### Importar JSON

```bash
POST /menus-semanales/importar
{
  "datos": {
    "semanas": [
      {
        "marca_id": "...",
        "fecha_inicio": "2026-06-15",
        "fecha_fin": "2026-06-21",
        "dias": [
          {
            "numero_dia_iso": 1,
            "nombre_dia": "Lunes",
            "fecha": "2026-06-15",
            "estado": "DIA_LABORAL",
            "opciones": [
              {
                "opcion_menu_marca_id": "...",
                "plato_id": "..."
              }
            ]
          }
          ...
        ]
      }
    ]
  },
  "modoSimulacion": false,
  "estrategiaConflicto": "ERROR"
}
```

## Máquina de Estados

### Versiones

```
BORRADOR → PROPUESTO → APROBADO → PUBLICADO → FINALIZADO
   ↓           ↓           ↓           ↓
CANCELADO  CANCELADO   CANCELADO  CANCELADO
   ↑           ↑
   └─── RECHAZAR ───┘
```

### Días

- DIA_LABORAL: Día normal con opciones
- FERIADO: Día festivo (puede sin opciones)
- CERRADO: Establecimiento cerrado
- SIN_CONFIGURAR: No configurado aún

## Validaciones

### Fechas

- Fecha inicio debe ser lunes
- Fecha fin debe ser domingo
- Diferencia exacta de 6 días (semana completa)

### Contexto Único

- No puede haber dos semanas iguales para marca + canal + empresa + fecha_inicio

### Platos

- No se puede repetir el mismo plato en una semana
- Debe ser un plato existente y no eliminado

### Importación

- Estructura JSON validada
- Exactamente 7 días por semana
- Hash verificado para evitar duplicados
- Transaccional: todo o nada

## Pruebas

Suite de 17+ casos de prueba que cubren:

1. ✅ Semana duplicada con canal/empresa nulos
2. ✅ Creación automática de 7 días
3. ✅ Feriados sin opciones
4. ✅ Plato repetido en semana
5. ✅ Opciones variables (A-D)
6. ✅ Transiciones válidas/inválidas
7. ✅ Permisos separados
8. ✅ Edición de publicada
9. ✅ Conservación de versión anterior
10. ✅ Reemplazo de publicada
11. ✅ Historial sin duplicados
12. ✅ WhatsApp generado
13. ✅ Excel legible
14. ✅ Dry-run sin cambios
15. ✅ Importación transaccional
16. ✅ Rollback ante error
17. ✅ Detección de duplicado

```bash
npm run test menus-semanales
```

## Auditoría

Todas las operaciones registran:

- Usuario que la ejecutó
- Entidad afectada
- Acción realizada
- Valores anteriores/nuevos
- Motivo del cambio

## Performance

- Índices optimizados en:
  - `semanas_menu(marca_id, canal_id, empresa_id, fecha_inicio)`
  - `versiones_semana_menu(semana_menu_id, estado, es_actual)`
  - `dias_version_menu(version_semana_id, fecha)`
  - `opciones_dia_menu(dia_version_menu_id, plato_id)`

## Base de Datos

Tablas creadas por migraciones 016-021:

- `semanas_menu` - Semanas lógicas
- `versiones_semana_menu` - Versiones
- `dias_version_menu` - Días
- `opciones_dia_menu` - Opciones de platos
- `plantillas_mensaje_menu` - Plantillas
- `importaciones_menu` - Registro de importaciones

## Próximas Mejoras

- [ ] Sincronización con Google Calendar
- [ ] Notificaciones automáticas
- [ ] Estadísticas de platos más usados
- [ ] Integración con sistema de inventario
- [ ] API para aplicación móvil
