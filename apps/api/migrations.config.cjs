const path = require("path");

function obtenerDatabaseUrlPruebasSegura() {
  const url = process.env.DATABASE_URL_PRUEBAS;

  if (!url) {
    throw new Error(
      "DATABASE_URL_PRUEBAS es obligatoria para migraciones de pruebas",
    );
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("DATABASE_URL_PRUEBAS inválida");
  }

  const host = String(parsed.hostname || "").toLowerCase();
  const database = String(
    (parsed.pathname || "").replace(/^\//, ""),
  ).toLowerCase();

  if (!/(prueba|pruebas|test|testing|qa)/.test(database)) {
    throw new Error(
      "DATABASE_URL_PRUEBAS rechazada: la base no parece de pruebas",
    );
  }

  if (
    /(prod|production|primary|master)/.test(host) ||
    /(prod|production)/.test(database)
  ) {
    throw new Error(
      "DATABASE_URL_PRUEBAS rechazada por política anti-producción",
    );
  }

  return url;
}

const config = {
  databaseUrl: obtenerDatabaseUrlPruebasSegura(),
  host: undefined,
  port: undefined,
  database: undefined,
  user: undefined,
  password: undefined,
  ssl: false,
  dir: path.join(__dirname, "migrations"),
  // Tabla oficial ya existente en el entorno de pruebas.
  migrationsTable: "pgmigrations",
};

module.exports = config;
