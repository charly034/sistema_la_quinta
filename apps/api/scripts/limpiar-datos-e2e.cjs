"use strict";
/**
 * Limpieza selectiva de datos E2E.
 * Recibe semanaId y una lista de platoIds (JSON) via process.env.
 * Solo elimina los registros propios del run E2E.
 * Respeta claves foráneas eliminando en el orden correcto.
 */
const { Client } = require("pg");

async function limpiarSemana(client, semanaId) {
  if (!semanaId) return;

  const semanaValida = await client.query(
    `SELECT s.id
     FROM semanas_menu s
     JOIN usuarios u ON u.id = s.creado_por
     WHERE s.id = $1
       AND LOWER(u.correo) LIKE '%e2e%'
     LIMIT 1`,
    [semanaId],
  );

  if (!semanaValida.rows[0]) {
    throw new Error(
      "E2E_SEMANA_LIMPIAR rechazada: la semana no pertenece a un usuario E2E",
    );
  }

  // 1. Detalles de propuestas (FK = propuesta_id o propuesta_menu_id según esquema)
  await client.query(
    `DELETE FROM propuestas_menu_detalle
     WHERE propuesta_id IN (
       SELECT id FROM propuestas_menu WHERE semana_menu_id = $1
     )
     OR dia_version_menu_id IN (
       SELECT d.id FROM dias_version_menu d
       JOIN versiones_semana_menu v ON v.id = d.version_semana_id
       WHERE v.semana_menu_id = $1
     )`,
    [semanaId],
  );

  // 2. Propuestas
  await client.query("DELETE FROM propuestas_menu WHERE semana_menu_id = $1", [
    semanaId,
  ]);

  // 3. Opciones de días
  await client.query(
    `DELETE FROM opciones_dia_menu
     WHERE dia_version_menu_id IN (
       SELECT d.id
       FROM dias_version_menu d
       JOIN versiones_semana_menu v ON v.id = d.version_semana_id
       WHERE v.semana_menu_id = $1
     )`,
    [semanaId],
  );

  // 4. Días de versiones
  await client.query(
    `DELETE FROM dias_version_menu
     WHERE version_semana_id IN (
       SELECT id FROM versiones_semana_menu WHERE semana_menu_id = $1
     )`,
    [semanaId],
  );

  // 5. Versiones
  await client.query(
    "DELETE FROM versiones_semana_menu WHERE semana_menu_id = $1",
    [semanaId],
  );

  // 6. Semana
  await client.query("DELETE FROM semanas_menu WHERE id = $1", [semanaId]);
}

async function limpiarPlatos(client, platoIds) {
  for (const id of platoIds || []) {
    await client.query("DELETE FROM opciones_dia_menu WHERE plato_id = $1", [
      id,
    ]);
    await client.query("DELETE FROM platos_categorias WHERE plato_id = $1", [
      id,
    ]);
    await client.query("DELETE FROM platos_proteinas WHERE plato_id = $1", [
      id,
    ]);
    await client.query("DELETE FROM platos_etiquetas WHERE plato_id = $1", [
      id,
    ]);
    await client.query("DELETE FROM platos WHERE id = $1", [id]);
  }
}

async function limpiarPlatosPorPrefijo(client, prefijo) {
  if (!prefijo) return;
  const result = await client.query(
    "SELECT id FROM platos WHERE codigo LIKE $1",
    [`${prefijo}%`],
  );
  const ids = result.rows.map((r) => r.id);
  await limpiarPlatos(client, ids);
}

async function main() {
  const url = process.env.DATABASE_URL_PRUEBAS;
  if (!url) throw new Error("DATABASE_URL_PRUEBAS es obligatoria");

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("DATABASE_URL_PRUEBAS inválida");
  }
  const dbName = String(parsed.pathname || "")
    .replace(/^\//, "")
    .toLowerCase();
  if (!/(prueba|pruebas|test|testing|qa)/.test(dbName)) {
    throw new Error("Rechazado: la base no parece de pruebas");
  }
  if (/(prod|production|primary|master)/.test(parsed.hostname.toLowerCase())) {
    throw new Error(
      "DATABASE_URL_PRUEBAS rechazada por política anti-producción",
    );
  }

  const semanaId = process.env.E2E_SEMANA_LIMPIAR || "";
  const platosRaw = process.env.E2E_PLATOS_LIMPIAR || "[]";
  const prefijoPlatos = process.env.E2E_PLATOS_PREFIJO || "";

  let platoIds = [];
  try {
    platoIds = JSON.parse(platosRaw);
  } catch {
    platoIds = [];
  }

  const client = new Client({ connectionString: url });
  await client.connect();

  try {
    await limpiarSemana(client, semanaId);
    await limpiarPlatos(client, platoIds);
    if (prefijoPlatos) {
      await limpiarPlatosPorPrefijo(client, prefijoPlatos);
    }
    console.log("[E2E] Limpieza completada.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("[E2E] Error en limpiar-datos-e2e:", err.message);
  process.exit(1);
});
