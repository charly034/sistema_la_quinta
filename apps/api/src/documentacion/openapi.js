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
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: [],
};

export const especificacionOpenAPI = swaggerJSDoc(options);
