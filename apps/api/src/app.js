import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/error.middleware.js";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(cors({ origin: "*" }));

  // Healthchecks fuera del versionado para infraestructura.
  app.get("/", (_req, res) => res.status(200).send("OK"));
  app.get("/health", (_req, res) => res.status(200).json({ ok: true }));

  app.use("/api/v1", routes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
