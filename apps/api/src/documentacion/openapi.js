import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "API La Quinta",
      version: "1.0.0",
      description: "Documentacion de endpoints nuevos de la API de La Quinta.",
    },
    servers: [{ url: "/api/v1" }],
    tags: [
      { name: "Platos", description: "Catalogo de platos" },
      {
        name: "ClasificacionesPlatos",
        description: "Catalogos de clasificaciones de platos",
      },
      {
        name: "MenusSemanales",
        description:
          "Gestión de menús semanales, versiones, exportación e importación",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    paths: {
      "/menu/platos": {
        get: {
          tags: ["Platos"],
          summary: "Listar platos",
          description:
            "Permite filtrar y buscar por nombre, codigo y alias usando el parametro buscar.",
          parameters: [
            { name: "marcaId", in: "query", schema: { type: "string" } },
            { name: "tipo", in: "query", schema: { type: "string" } },
            { name: "estado", in: "query", schema: { type: "string" } },
            {
              name: "buscar",
              in: "query",
              schema: { type: "string" },
              description: "Busca en nombre, codigo y alias",
            },
            {
              name: "categoriaId",
              in: "query",
              schema: { type: "string" },
            },
            {
              name: "proteinaId",
              in: "query",
              schema: { type: "string" },
            },
            {
              name: "includeArchivados",
              in: "query",
              schema: { type: "boolean" },
            },
          ],
          responses: {
            200: { description: "Listado de platos" },
            401: { description: "No autenticado" },
            403: { description: "Sin permisos" },
          },
        },
        post: {
          tags: ["Platos"],
          summary: "Crear plato",
          responses: {
            201: { description: "Plato creado" },
            409: { description: "Plato duplicado" },
          },
        },
      },
      "/menu/platos/{id}": {
        get: {
          tags: ["Platos"],
          summary: "Obtener plato por id",
          responses: {
            200: { description: "Detalle de plato" },
            404: { description: "Plato no encontrado" },
          },
        },
        patch: {
          tags: ["Platos"],
          summary: "Actualizar plato",
          responses: {
            200: { description: "Plato actualizado" },
          },
        },
      },
      "/menu/platos/{id}/componentes": {
        get: {
          tags: ["Platos"],
          summary: "Listar componentes de un plato",
          responses: {
            200: { description: "Componentes del plato" },
            404: { description: "Plato no encontrado" },
          },
        },
        put: {
          tags: ["Platos"],
          summary: "Reemplazar componentes de un plato",
          responses: {
            200: { description: "Componentes actualizados" },
            409: {
              description:
                "CICLO_COMPONENTES o COMPONENTE_INVALIDO ante integridad invalida",
            },
          },
        },
      },
      "/menu/platos/{id}/relaciones": {
        get: {
          tags: ["Platos"],
          summary: "Obtener relaciones clasificatorias de un plato",
          responses: {
            200: {
              description:
                "Categorias, proteinas, etiquetas, ingredientes, alergenos y caracteristicas",
            },
          },
        },
      },
      "/menu/{recurso}": {
        get: {
          tags: ["ClasificacionesPlatos"],
          summary: "Listar clasificaciones",
          description:
            "Recursos finales: categorias, proteinas, etiquetas, ingredientes, alergenos, caracteristicas-alimentarias. Alias de transicion: categorias-plato, etiquetas-plato.",
          responses: { 200: { description: "Listado" } },
        },
        post: {
          tags: ["ClasificacionesPlatos"],
          summary: "Crear clasificacion",
          responses: { 201: { description: "Registro creado" } },
        },
      },
      "/menu/{recurso}/{id}": {
        get: {
          tags: ["ClasificacionesPlatos"],
          summary: "Obtener clasificacion",
          responses: { 200: { description: "Registro" } },
        },
        patch: {
          tags: ["ClasificacionesPlatos"],
          summary: "Actualizar clasificacion",
          responses: { 200: { description: "Registro actualizado" } },
        },
      },
      "/menu/categorias-plato": {
        get: {
          tags: ["ClasificacionesPlatos"],
          summary: "Alias transitorio de /menu/categorias",
          deprecated: true,
          responses: { 200: { description: "Listado" } },
        },
      },
      "/menu/etiquetas-plato": {
        get: {
          tags: ["ClasificacionesPlatos"],
          summary: "Alias transitorio de /menu/etiquetas",
          deprecated: true,
          responses: { 200: { description: "Listado" } },
        },
      },
      "/menu/semanas": {
        get: {
          tags: ["MenusSemanales"],
          summary: "Listar semanas de menú",
          responses: {
            200: { description: "Semanas listadas" },
            401: { description: "No autenticado" },
            403: { description: "Sin permiso MENUS_LEER" },
          },
        },
        post: {
          tags: ["MenusSemanales"],
          summary: "Crear semana de menú",
          responses: {
            201: { description: "Semana creada" },
            409: { description: "Semana duplicada" },
          },
        },
      },
      "/menu/semanas/{id}": {
        get: {
          tags: ["MenusSemanales"],
          summary: "Obtener semana completa",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            200: { description: "Semana encontrada" },
            404: { description: "Semana no encontrada" },
          },
        },
        patch: {
          tags: ["MenusSemanales"],
          summary: "Actualizar semana",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            200: { description: "Semana actualizada" },
            501: { description: "No implementado" },
          },
        },
      },
      "/menu/semanas/{id}/duplicar": {
        post: {
          tags: ["MenusSemanales"],
          summary: "Duplicar semana",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            201: { description: "Semana duplicada" },
            404: { description: "Semana origen no encontrada" },
          },
        },
      },
      "/menu/semanas/{id}/versiones": {
        get: {
          tags: ["MenusSemanales"],
          summary: "Listar versiones de una semana",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: { 200: { description: "Versiones listadas" } },
        },
        post: {
          tags: ["MenusSemanales"],
          summary: "Crear nueva versión",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: { 201: { description: "Versión creada" } },
        },
      },
      "/menu/semanas/{id}/versiones/{versionId}": {
        get: {
          tags: ["MenusSemanales"],
          summary: "Obtener versión específica",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
            {
              name: "versionId",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            200: { description: "Versión encontrada" },
            404: { description: "Versión no encontrada" },
          },
        },
        put: {
          tags: ["MenusSemanales"],
          summary: "Actualizar versión",
          responses: {
            200: { description: "Versión actualizada" },
            501: { description: "No implementado" },
          },
        },
      },
      "/menu/semanas/{id}/versiones/{versionId}/dias/{fecha}": {
        put: {
          tags: ["MenusSemanales"],
          summary: "Editar día de una versión",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
            {
              name: "versionId",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
            {
              name: "fecha",
              in: "path",
              required: true,
              schema: { type: "string", format: "date" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    estado: {
                      type: "string",
                      enum: [
                        "DIA_LABORAL",
                        "FERIADO",
                        "CERRADO",
                        "SIN_CONFIGURAR",
                      ],
                    },
                    textoEstado: { type: "string" },
                    observaciones: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Día actualizado" },
            404: { description: "Día no encontrado" },
            409: { description: "Versión no editable" },
          },
        },
      },
      "/menu/semanas/{id}/versiones/{versionId}/dias/{fecha}/opciones": {
        put: {
          tags: ["MenusSemanales"],
          summary: "Editar opciones de un día",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
            {
              name: "versionId",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
            {
              name: "fecha",
              in: "path",
              required: true,
              schema: { type: "string", format: "date" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    opciones: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          opcionMenuMarcaId: { type: "string", format: "uuid" },
                          platoId: { type: "string", format: "uuid" },
                          orden: { type: "integer" },
                          bloqueadoManual: { type: "boolean" },
                          observaciones: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Opciones actualizadas" },
            404: { description: "Día no encontrado" },
            409: { description: "Versión no editable o duplicado en día" },
          },
        },
      },
      "/menu/semanas/{id}/versiones/{versionId}/proponer": {
        post: {
          tags: ["MenusSemanales"],
          summary: "Transicionar versión a PROPUESTO",
          responses: { 200: { description: "Versión propuesta" } },
        },
      },
      "/menu/semanas/{id}/versiones/{versionId}/aprobar": {
        post: {
          tags: ["MenusSemanales"],
          summary: "Transicionar versión a APROBADO",
          responses: {
            200: { description: "Versión aprobada" },
            403: { description: "Sin permiso MENUS_APROBAR" },
          },
        },
      },
      "/menu/semanas/{id}/versiones/{versionId}/publicar": {
        post: {
          tags: ["MenusSemanales"],
          summary: "Transicionar versión a PUBLICADO",
          responses: {
            200: { description: "Versión publicada" },
            403: { description: "Sin permiso MENUS_PUBLICAR" },
          },
        },
      },
      "/menu/semanas/{id}/versiones/{versionId}/finalizar": {
        post: {
          tags: ["MenusSemanales"],
          summary: "Transicionar versión a FINALIZADO",
          responses: { 200: { description: "Versión finalizada" } },
        },
      },
      "/menu/semanas/{id}/versiones/{versionId}/cancelar": {
        post: {
          tags: ["MenusSemanales"],
          summary: "Transicionar versión a CANCELADO",
          responses: { 200: { description: "Versión cancelada" } },
        },
      },
      "/menu/semanas/{id}/mensaje-whatsapp": {
        get: {
          tags: ["MenusSemanales"],
          summary: "Generar mensaje WhatsApp",
          responses: { 200: { description: "Mensaje generado" } },
        },
      },
      "/menu/semanas/{id}/exportar/texto": {
        get: {
          tags: ["MenusSemanales"],
          summary: "Exportar menú a texto",
          responses: { 200: { description: "Exportación texto" } },
        },
      },
      "/menu/semanas/{id}/exportar/excel": {
        get: {
          tags: ["MenusSemanales"],
          summary: "Exportar menú a Excel",
          responses: {
            200: {
              description: "Archivo Excel binario",
              content: {
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                  {
                    schema: { type: "string", format: "binary" },
                  },
              },
            },
          },
        },
      },
      "/menu/platos/{id}/historial-uso": {
        get: {
          tags: ["MenusSemanales"],
          summary: "Historial de uso de plato en menús",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
            {
              name: "marcaId",
              in: "query",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: { 200: { description: "Historial de uso" } },
        },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: [],
};

export const especificacionOpenAPI = swaggerJSDoc(options);
