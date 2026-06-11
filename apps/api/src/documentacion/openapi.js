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
    },
    security: [{ BearerAuth: [] }],
  },
  apis: [],
};

export const especificacionOpenAPI = swaggerJSDoc(options);
