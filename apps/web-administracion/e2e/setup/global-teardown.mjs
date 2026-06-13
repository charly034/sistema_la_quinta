/**
 * Global Teardown del arnés E2E.
 * Limpia los datos sembrados en globalSetup y generados por los tests.
 * Usa el script limpiar-datos-e2e.cjs (acceso directo a DB).
 */
import { execSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync, unlinkSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const API_DIR = join(__dirname, "..", "..", "..", "api");

export default async function globalTeardown() {
  const semanaId = process.env._E2E_SEMANA_LIMPIAR;
  const platosRaw = process.env._E2E_PLATOS_LIMPIAR || "[]";
  const prefijoPlatos = process.env._E2E_PLATOS_PREFIJO || "";

  if (!process.env.DATABASE_URL_PRUEBAS) {
    console.log("[E2E] Sin DATABASE_URL_PRUEBAS — omitiendo limpieza.");
    return;
  }
  if (!semanaId && !prefijoPlatos) {
    console.log("[E2E] Sin datos para limpiar.");
    return;
  }

  console.log("[E2E] Ejecutando limpieza de datos...");

  try {
    execSync("node scripts/limpiar-datos-e2e.cjs", {
      cwd: API_DIR,
      env: {
        ...process.env,
        DATABASE_URL_PRUEBAS: process.env.DATABASE_URL_PRUEBAS,
        E2E_SEMANA_LIMPIAR: semanaId || "",
        E2E_PLATOS_LIMPIAR: platosRaw,
        E2E_PLATOS_PREFIJO: prefijoPlatos,
      },
      stdio: ["pipe", "inherit", "pipe"],
    });
  } catch (err) {
    console.error("[E2E] Error en limpieza:", err.message);
  }

  // Eliminar archivo de estado temporal
  const estadoPath = join(__dirname, ".e2e-usuario.json");
  if (existsSync(estadoPath)) {
    try {
      unlinkSync(estadoPath);
    } catch {
      /* ignorar */
    }
  }

  console.log("[E2E] Teardown completado.\n");
}
