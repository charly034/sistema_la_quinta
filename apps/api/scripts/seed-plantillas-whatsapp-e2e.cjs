"use strict";
/**
 * Asegura plantillas WHATSAPP predeterminadas para E2E.
 * Idempotente: inserta solo si no existen.
 */
const { Client } = require("pg");

const CONFIGURACION = {
  usar_rango_operativo: true,
  incluir_feriados: true,
  incluir_cerrados: false,
  incluir_sin_configurar: false,
  incluir_fin_de_semana: false,
  mostrar_fecha_en_feriados: false,
};

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

  const client = new Client({ connectionString: url });
  await client.connect();

  try {
    const usuarioRes = await client.query(
      "SELECT id FROM usuarios ORDER BY creado_en ASC LIMIT 1",
    );
    if (!usuarioRes.rows[0]) {
      throw new Error("No hay usuarios para registrar plantillas");
    }
    const usuarioId = usuarioRes.rows[0].id;

    const marcaRes = await client.query(
      "SELECT id FROM marcas WHERE codigo = 'LA_QUINTA' LIMIT 1",
    );
    if (!marcaRes.rows[0]) {
      throw new Error("No existe marca LA_QUINTA");
    }
    const marcaId = marcaRes.rows[0].id;

    await client.query(
      `INSERT INTO plantillas_mensaje_menu (
        id, marca_id, canal_id, empresa_id, nombre, tipo, plantilla,
        configuracion, estado, es_predeterminada, creado_por, creado_en, actualizado_en
      )
      SELECT
        gen_random_uuid(), $1, NULL, NULL,
        'Plantilla predeterminada WhatsApp La Quinta',
        'WHATSAPP',
        E'SEMANA {{rango_semana}}\\n\\n{{contenido_dias}}',
        $2::jsonb,
        'ACTIVA',
        true,
        $3,
        NOW(),
        NOW()
      WHERE NOT EXISTS (
        SELECT 1
        FROM plantillas_mensaje_menu p
        WHERE p.tipo = 'WHATSAPP'
          AND p.estado = 'ACTIVA'
          AND p.es_predeterminada = true
          AND p.eliminado_en IS NULL
          AND p.marca_id = $1
          AND p.canal_id IS NULL
          AND p.empresa_id IS NULL
      )`,
      [marcaId, JSON.stringify(CONFIGURACION), usuarioId],
    );

    await client.query(
      `INSERT INTO plantillas_mensaje_menu (
        id, marca_id, canal_id, empresa_id, nombre, tipo, plantilla,
        configuracion, estado, es_predeterminada, creado_por, creado_en, actualizado_en
      )
      SELECT
        gen_random_uuid(), NULL, NULL, NULL,
        'Plantilla global WhatsApp',
        'WHATSAPP',
        E'SEMANA {{rango_semana}}\\n\\n{{contenido_dias}}',
        $1::jsonb,
        'ACTIVA',
        true,
        $2,
        NOW(),
        NOW()
      WHERE NOT EXISTS (
        SELECT 1
        FROM plantillas_mensaje_menu p
        WHERE p.tipo = 'WHATSAPP'
          AND p.estado = 'ACTIVA'
          AND p.es_predeterminada = true
          AND p.eliminado_en IS NULL
          AND p.marca_id IS NULL
          AND p.canal_id IS NULL
          AND p.empresa_id IS NULL
      )`,
      [JSON.stringify(CONFIGURACION), usuarioId],
    );

    const conteo = await client.query(
      `SELECT COUNT(*) AS n
       FROM plantillas_mensaje_menu
       WHERE tipo = 'WHATSAPP'
         AND estado = 'ACTIVA'
         AND es_predeterminada = true
         AND eliminado_en IS NULL`,
    );
    console.log(
      `[seed-whatsapp] Plantillas WHATSAPP predeterminadas activas: ${conteo.rows[0].n}`,
    );
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("[seed-whatsapp] Error:", err.message);
  process.exit(1);
});
