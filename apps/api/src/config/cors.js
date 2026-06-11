import { normalizarListaOrigenes } from "../utils/seguridad.js";

export function crearConfiguracionCORS(origenesPermitidos = []) {
  const listaNormalizada = normalizarListaOrigenes(
    Array.isArray(origenesPermitidos)
      ? origenesPermitidos.join(",")
      : origenesPermitidos,
  );
  return {
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (listaNormalizada.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origen no permitido por CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Authorization"],
  };
}
