import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import dotenv from "dotenv";

const archivoActual = fileURLToPath(import.meta.url);
const directorioActual = path.dirname(archivoActual);

export const API_ROOT = path.resolve(directorioActual, "../../..");
export const RUTA_ENV_API = path.resolve(API_ROOT, ".env");

function valorDefinido(valor) {
  return Boolean(String(valor || "").trim());
}

export function obtenerDiagnosticoEntornoPruebas({
  env = process.env,
  rutaEnv = RUTA_ENV_API,
} = {}) {
  return {
    directorio_actual: process.cwd(),
    ruta_env_calculada: rutaEnv,
    archivo_env_existe: existsSync(rutaEnv),
    DATABASE_URL_PRUEBAS_definida: valorDefinido(env.DATABASE_URL_PRUEBAS),
  };
}

export function cargarEntornoPruebas({
  env = process.env,
  rutaEnv = RUTA_ENV_API,
} = {}) {
  if (!valorDefinido(env.DATABASE_URL_PRUEBAS) && existsSync(rutaEnv)) {
    dotenv.config({
      path: rutaEnv,
      override: false,
      processEnv: env,
    });
  }

  if (!valorDefinido(env.DATABASE_URL_PRUEBAS)) {
    throw new Error(
      "DATABASE_URL_PRUEBAS es obligatoria para integraciones. No se aceptan fallback DATABASE_URL/DB_*.",
    );
  }

  return obtenerDiagnosticoEntornoPruebas({ env, rutaEnv });
}

export function obtenerUrlPruebas({
  env = process.env,
  rutaEnv = RUTA_ENV_API,
} = {}) {
  cargarEntornoPruebas({ env, rutaEnv });
  return String(env.DATABASE_URL_PRUEBAS)
    .trim()
    .replace(/^['\"]|['\"]$/g, "");
}

export function validarBasePruebas(url) {
  if (!valorDefinido(url)) {
    throw new Error("DATABASE_URL_PRUEBAS es obligatoria para integraciones");
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("DATABASE_URL_PRUEBAS inválida");
  }

  const base = String(parsed.pathname || "")
    .replace(/^\//, "")
    .trim();
  const host = String(parsed.hostname || "").toLowerCase();
  const puerto = String(parsed.port || "");
  const baseLower = base.toLowerCase();

  const patronesPermitidos = ["prueba", "pruebas", "test", "testing", "qa"];
  if (!patronesPermitidos.some((p) => baseLower.includes(p))) {
    throw new Error(
      "DATABASE_URL_PRUEBAS no parece base de pruebas (nombre sin prueba/test/qa)",
    );
  }

  const patronesProduccion = ["prod", "production", "live", "main", "master"];
  if (patronesProduccion.some((p) => baseLower.includes(p))) {
    throw new Error(
      "DATABASE_URL_PRUEBAS rechazada por política anti-producción",
    );
  }

  const hostSospechoso =
    patronesProduccion.some((p) => host.includes(p)) ||
    ["rds.amazonaws.com", "azure.com", "gcp", "cloudsql"].some((p) =>
      host.includes(p),
    );

  if (hostSospechoso) {
    throw new Error(
      "DATABASE_URL_PRUEBAS rechazada por política anti-producción (host sospechoso de producción)",
    );
  }

  return {
    base,
    host,
    puerto,
    anti_produccion: "APROBADA",
  };
}
