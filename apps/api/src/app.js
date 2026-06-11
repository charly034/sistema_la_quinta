import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import routes from "./routes/index.js";
import { crearConfiguracionCORS } from "./config/cors.js";
import { obtenerConfiguracionAplicacion } from "./config/entorno.js";
import { especificacionOpenAPI } from "./documentacion/openapi.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/error.middleware.js";

export function createApp() {
  const app = express();
  const configuracion = obtenerConfiguracionAplicacion();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cors(crearConfiguracionCORS(configuracion.origenesPermitidos)));

  // Healthchecks fuera del versionado para infraestructura.
  app.get("/", (_req, res) => res.status(200).send("OK"));
  app.get("/health", (_req, res) => res.status(200).json({ ok: true }));

  app.use(
    "/api/v1/documentacion",
    swaggerUi.serve,
    swaggerUi.setup(especificacionOpenAPI, { explorer: true }),
  );
  app.use("/api/v1", routes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
