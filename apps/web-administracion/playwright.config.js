import { defineConfig } from "@playwright/test";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  obtenerJwtSecretoE2E,
  validarDatabaseUrlPruebas,
} from "./e2e/setup/e2e-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Carga segura de .env.e2e (sin dotenv, sin dependencias extra) ---
function cargarEnvE2E() {
  const ruta = join(__dirname, ".env.e2e");
  if (!existsSync(ruta)) return;
  for (const linea of readFileSync(ruta, "utf8").split("\n")) {
    const m = linea.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.+)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  }
}
cargarEnvE2E();

const E2E_API_URL = process.env.E2E_API_URL || "http://localhost:3001";
const E2E_WEB_URL = process.env.E2E_WEB_URL || "http://localhost:5174";
const API_PORT = new URL(E2E_API_URL).port || "3001";
const API_DIR = join(__dirname, "..", "api");
const DATABASE_URL_PRUEBAS = process.env.DATABASE_URL_PRUEBAS || "";

if (!DATABASE_URL_PRUEBAS) {
  throw new Error("DATABASE_URL_PRUEBAS es obligatoria para Playwright E2E");
}

validarDatabaseUrlPruebas(DATABASE_URL_PRUEBAS);

const JWT_SECRETO_E2E = obtenerJwtSecretoE2E();

export default defineConfig({
  testDir: "./e2e",
  timeout: 360000, // 6 min por test (generación de propuestas puede tardar ~150s)
  retries: 0,
  workers: 1, // Tests E2E secuenciales (comparten semana sembrada)
  globalSetup: "./e2e/setup/global-setup.mjs",
  globalTeardown: "./e2e/setup/global-teardown.mjs",
  use: {
    baseURL: E2E_WEB_URL,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
    permissions: ["clipboard-read", "clipboard-write"],
  },
  webServer: [
    {
      // API de pruebas — NODE_ENV=test garantiza uso de DATABASE_URL_PRUEBAS
      command: "node index.js",
      cwd: API_DIR,
      url: `${E2E_API_URL}/health`,
      timeout: 120000,
      reuseExistingServer: false, // siempre arrancar fresh para que las variables del motor apliquen
      stdout: "pipe",
      stderr: "pipe",
      env: {
        NODE_ENV: "test",
        PORT: API_PORT,
        DATABASE_URL_PRUEBAS,
        // JWT E2E predeterminado != secreto de producción.
        JWT_SECRETO_ACCESO: JWT_SECRETO_E2E,
        JWT_DURACION_ACCESO: "15m",
        CORS_ORIGENES_PERMITIDOS: E2E_WEB_URL,
        AUDITORIA_HABILITADA: "true",
        // Límite alto para E2E (no tiene en cuenta rate-limit real de producción)
        RATE_LIMIT_AUTENTICACION_MAXIMO: "200",
        RATE_LIMIT_AUTENTICACION_VENTANA_MS: "60000",
        // Motor de propuestas: límites reducidos para E2E (velocidad > exhaustividad)
        MOTOR_PROPUESTAS_TIMEOUT_MS: "8000",
        MOTOR_PROPUESTAS_MAX_NODOS: "5000",
      },
    },
    {
      // Frontend Vite apuntando a la API E2E
      command: "npm run dev",
      url: E2E_WEB_URL,
      timeout: 60000,
      reuseExistingServer: true,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        VITE_API_URL: `${E2E_API_URL}/api/v1`,
      },
    },
  ],
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
});
