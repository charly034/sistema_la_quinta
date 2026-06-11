const path = require("path");

function normalizarValor(valor) {
  return valor === undefined || valor === null || valor === ""
    ? undefined
    : valor;
}

const config = {
  databaseUrl: normalizarValor(process.env.DATABASE_URL_PRUEBAS),
  host: normalizarValor(process.env.DB_HOST),
  port: normalizarValor(process.env.DB_PORT)
    ? Number(process.env.DB_PORT)
    : undefined,
  database: normalizarValor(process.env.DB_NAME),
  user: normalizarValor(process.env.DB_USER),
  password: normalizarValor(process.env.DB_PASSWORD),
  ssl:
    String(process.env.DB_SSL || "").toLowerCase() === "true" ||
    String(process.env.DB_SSL || "").toLowerCase() === "1"
      ? { rejectUnauthorized: false }
      : undefined,
  dir: path.join(__dirname, "migrations"),
  // Tabla oficial ya existente en el entorno de pruebas.
  migrationsTable: "pgmigrations",
};

module.exports = config;
