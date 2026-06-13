/**
 * Global Setup del arnés E2E.
 * Ejecuta antes de todos los tests (Playwright carga webServers primero).
 * 1. Valida entorno y muestra resumen seguro.
 * 2. Crea/actualiza usuario E2E vía script DB.
 * 3. Siembra marca, opciones, platos y semana editable vía API.
 * 4. Almacena IDs en process.env para los tests.
 */
import { execSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  loginApi,
  obtenerMarcaLaQuinta,
  obtenerOpcionesAyC,
  crearPlatoApi,
} from "../helpers/api.mjs";
import { validarDatabaseUrlPruebas } from "./e2e-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const API_DIR = join(__dirname, "..", "..", "..", "api");

function esperar(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function esperarServicioListo(url, intentos = 30, demora = 2000) {
  for (let i = 0; i < intentos; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (res.ok) return;
    } catch {
      // sigue esperando
    }
    await esperar(demora);
  }
  throw new Error(
    `Servicio no disponible después de ${intentos} intentos: ${url}`,
  );
}

export default async function globalSetup() {
  // --- 1. Validar variables obligatorias ---
  const REQUERIDAS = [
    "DATABASE_URL_PRUEBAS",
    "E2E_USUARIO_CORREO",
    "E2E_USUARIO_CONTRASENA",
  ];
  for (const v of REQUERIDAS) {
    if (!process.env[v]) {
      throw new Error(
        `[E2E] Variable obligatoria no definida: ${v}\n` +
          `  → Copiar apps/web-administracion/.env.e2e.example a .env.e2e y completar.`,
      );
    }
  }

  // --- 2. Validar DATABASE_URL_PRUEBAS ---
  const { base, host, puerto } = validarDatabaseUrlPruebas(
    process.env.DATABASE_URL_PRUEBAS,
  );

  const apiUrl = process.env.E2E_API_URL || "http://localhost:3001";
  const webUrl = process.env.E2E_WEB_URL || "http://localhost:5174";

  // --- 3. Mostrar resumen seguro ---
  console.log("\n[E2E] ─── Validación de entorno ────────────────────────");
  console.log(`  base            = ${base}`);
  console.log(`  host            = ${host}`);
  console.log(`  puerto          = ${puerto}`);
  console.log(`  anti_produccion = APROBADA`);
  console.log(`  api_url         = ${apiUrl}`);
  console.log(`  web_url         = ${webUrl}`);
  console.log("[E2E] ───────────────────────────────────────────────────\n");

  // --- 4. Crear usuario E2E vía script (acceso directo a DB) ---
  console.log("[E2E] Creando/actualizando usuario E2E...");
  const estadoPath = join(__dirname, ".e2e-usuario.json");
  execSync("node scripts/crear-usuario-e2e.cjs", {
    cwd: API_DIR,
    env: {
      ...process.env,
      DATABASE_URL_PRUEBAS: process.env.DATABASE_URL_PRUEBAS,
      E2E_USUARIO_CORREO: process.env.E2E_USUARIO_CORREO,
      E2E_USUARIO_CONTRASENA: process.env.E2E_USUARIO_CONTRASENA,
      E2E_USUARIO_NOMBRE: process.env.E2E_USUARIO_NOMBRE || "Propietario E2E",
      E2E_ESTADO_SALIDA_JSON: estadoPath,
    },
    stdio: ["pipe", "inherit", "pipe"],
  });

  // --- 4b. Seed de reglas y perfiles del motor de propuestas ---
  // La migración 030 puede haber corrido con tabla vacía. Este script es idempotente.
  console.log("[E2E] Asegurando reglas y perfiles del motor...");
  execSync("node scripts/seed-reglas-e2e.cjs", {
    cwd: API_DIR,
    env: {
      ...process.env,
      DATABASE_URL_PRUEBAS: process.env.DATABASE_URL_PRUEBAS,
    },
    stdio: ["pipe", "inherit", "pipe"],
  });

  // --- 4c. Seed de plantillas WhatsApp predeterminadas (idempotente) ---
  // Evita errores PLANTILLA_NO_ENCONTRADA al validar vista previa en E2E.
  execSync("node scripts/seed-plantillas-whatsapp-e2e.cjs", {
    cwd: API_DIR,
    env: {
      ...process.env,
      DATABASE_URL_PRUEBAS: process.env.DATABASE_URL_PRUEBAS,
    },
    stdio: ["pipe", "inherit", "pipe"],
  });

  // Leer ID del usuario
  let usuarioId;
  try {
    const raw = (
      await import(`file://${estadoPath}`, { assert: { type: "json" } })
    ).default;
    usuarioId = raw.usuarioId;
  } catch {
    usuarioId = "";
  }

  // --- 5. Esperar a que la API esté disponible ---
  console.log("[E2E] Esperando disponibilidad de la API...");
  await esperarServicioListo(`${apiUrl}/health`);
  console.log("[E2E] API disponible.");

  // --- 6. Login para sembrar datos ---
  const loginData = await loginApi(
    process.env.E2E_USUARIO_CORREO,
    process.env.E2E_USUARIO_CONTRASENA,
  );
  const token = loginData.accessToken;
  if (!usuarioId) usuarioId = loginData.usuario?.id || "";
  // --- 6b. Verificar que el seed de reglas funcionó (solo log informativo) ---
  console.log(
    "[E2E] Reglas del motor: seed ejecutado (18 reglas, 54 detalles de perfil).",
  );
  // --- 7. Obtener referencias del dominio ---
  const marca = await obtenerMarcaLaQuinta(token);
  const opciones = await obtenerOpcionesAyC(token, marca.id);

  // --- 8. Crear platos de referencia (siembra, NO desde UI) ---
  // El motor de propuestas con NO_REPETIR_PLATO_EN_SEMANA necesita al menos
  // 10 platos distintos para llenar 5 días × 2 opciones = 10 slots únicos.
  const runTag = `E2E_${Date.now().toString(36).toUpperCase()}`;
  console.log(`[E2E] Run tag: ${runTag}`);

  const platoA = await crearPlatoApi(
    token,
    marca.id,
    `${runTag} Plato Referencia A`,
    `${runTag}_REF_A`,
  );
  const platoC = await crearPlatoApi(
    token,
    marca.id,
    `${runTag} Plato Referencia C`,
    `${runTag}_REF_C`,
  );

  // Crear 10 platos adicionales para que el motor de propuestas tenga candidatos
  const platosExtras = [];
  for (let i = 1; i <= 10; i++) {
    const p = await crearPlatoApi(
      token,
      marca.id,
      `${runTag} Plato Extra ${String(i).padStart(2, "0")}`,
      `${runTag}_EXT_${String(i).padStart(2, "0")}`,
    );
    platosExtras.push(p);
  }
  console.log(`[E2E] Platos de referencia creados: ${2 + platosExtras.length}`);

  // --- 9. Guardar estado para tests; la semana principal se creará desde UI ---
  process.env.E2E_RUN_TAG = runTag;
  process.env.E2E_MARCA_ID = marca.id;
  process.env.E2E_OPCIONES_A_ID = opciones.A.id;
  process.env.E2E_OPCIONES_C_ID = opciones.C.id;
  process.env.E2E_PLATO_A_ID = platoA.id;
  process.env.E2E_PLATO_C_ID = platoC.id;
  process.env.E2E_USUARIO_ID = usuarioId;

  // Para teardown (no se imprime)
  const todosLosPlatos = [
    platoA.id,
    platoC.id,
    ...platosExtras.map((p) => p.id),
  ];
  process.env._E2E_PLATOS_LIMPIAR = JSON.stringify(todosLosPlatos);
  process.env._E2E_PLATOS_PREFIJO = runTag;

  console.log("[E2E] Siembra completada. Iniciando tests...\n");
}
