const JWT_SECRETO_E2E_POR_DEFECTO = "secreto-e2e-no-productivo";

export function obtenerJwtSecretoE2E(env = process.env) {
  return env.JWT_SECRETO_ACCESO || JWT_SECRETO_E2E_POR_DEFECTO;
}

export function validarDatabaseUrlPruebas(databaseUrl) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL_PRUEBAS es obligatoria en entorno E2E");
  }

  const url = new URL(databaseUrl);
  const base = url.pathname.replace(/^\//, "");
  const host = url.hostname;
  const puerto = url.port || "5432";

  if (!/(prueba|pruebas|test|testing|qa)/i.test(base)) {
    throw new Error(
      `DATABASE_URL_PRUEBAS rechazada: base "${base}" no parece de pruebas`,
    );
  }

  if (/(prod|production|primary|master)/i.test(host)) {
    throw new Error(
      "DATABASE_URL_PRUEBAS rechazada por política anti-producción",
    );
  }

  return { base, host, puerto };
}
