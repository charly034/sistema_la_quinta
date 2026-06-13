"use strict";
/**
 * Re-siembra las reglas y perfiles iniciales del motor de propuestas.
 * Equivale a la migración 030 pero idempotente y ejecutable cuando ya existen usuarios.
 * Seguro: solo inserta si no existe.
 */
const { Client } = require("pg");

const TIPOS_REGLA = {
  NO_REPETIR_PLATO_EN_SEMANA: {
    naturaleza: "OBLIGATORIA",
    prioridad: 10,
    peso: 0,
    parametros: {},
  },
  ANTIGUEDAD_MINIMA_PLATO: {
    naturaleza: "OBLIGATORIA",
    prioridad: 9,
    peso: 0,
    parametros: { semanas_minimas: 2 },
  },
  EVITAR_MISMA_CATEGORIA_EN_EL_DIA: {
    naturaleza: "OBLIGATORIA",
    prioridad: 8,
    peso: 0,
    parametros: {},
  },
  EVITAR_MISMA_PROTEINA_EN_EL_DIA: {
    naturaleza: "OBLIGATORIA",
    prioridad: 8,
    peso: 0,
    parametros: {},
  },
  EXCLUIR_PLATOS_INACTIVOS: {
    naturaleza: "OBLIGATORIA",
    prioridad: 10,
    peso: 0,
    parametros: {},
  },
  EXCLUIR_PLATOS_ARCHIVADOS: {
    naturaleza: "OBLIGATORIA",
    prioridad: 10,
    peso: 0,
    parametros: {},
  },
  EXCLUIR_PLATOS_BLOQUEADOS: {
    naturaleza: "OBLIGATORIA",
    prioridad: 10,
    peso: 0,
    parametros: {},
  },
  PRIORIZAR_HISTORICO_POR_DIA: {
    naturaleza: "PREFERENCIAL",
    prioridad: 5,
    peso: 9,
    parametros: { factor: 1 },
  },
  PRIORIZAR_PLATOS_MENOS_USADOS: {
    naturaleza: "PREFERENCIAL",
    prioridad: 5,
    peso: 7,
    parametros: { factor: 1 },
  },
  PRIORIZAR_RENOVACION: {
    naturaleza: "PREFERENCIAL",
    prioridad: 5,
    peso: 9,
    parametros: { factor: 1 },
  },
  PRIORIZAR_FAVORITOS: {
    naturaleza: "PREFERENCIAL",
    prioridad: 4,
    peso: 5,
    parametros: { factor: 1 },
  },
  PREMIAR_VARIEDAD_CATEGORIAS: {
    naturaleza: "PREFERENCIAL",
    prioridad: 5,
    peso: 7,
    parametros: {},
  },
  PREMIAR_VARIEDAD_PROTEINAS: {
    naturaleza: "PREFERENCIAL",
    prioridad: 5,
    peso: 7,
    parametros: {},
  },
  RESPETAR_TEMPORADA: {
    naturaleza: "PREFERENCIAL",
    prioridad: 7,
    peso: 6,
    parametros: {},
  },
  EVITAR_CATEGORIA_DIAS_CONSECUTIVOS: {
    naturaleza: "PREFERENCIAL",
    prioridad: 7,
    peso: 8,
    parametros: {},
  },
  EVITAR_PROTEINA_DIAS_CONSECUTIVOS: {
    naturaleza: "PREFERENCIAL",
    prioridad: 7,
    peso: 8,
    parametros: {},
  },
  PENALIZAR_REPETICION_COMPONENTE_PRINCIPAL: {
    naturaleza: "PREFERENCIAL",
    prioridad: 6,
    peso: -6,
    parametros: {},
  },
  PENALIZAR_REPETICION_GUARNICION: {
    naturaleza: "PREFERENCIAL",
    prioridad: 6,
    peso: -6,
    parametros: {},
  },
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
    // Obtener primer usuario como creador
    const usuarioRes = await client.query(
      "SELECT id FROM usuarios ORDER BY creado_en ASC LIMIT 1",
    );
    if (!usuarioRes.rows[0])
      throw new Error(
        "No hay usuarios en la DB. Ejecutar crear-propietario primero.",
      );
    const creadorId = usuarioRes.rows[0].id;

    // Insertar reglas
    for (const [codigo, cfg] of Object.entries(TIPOS_REGLA)) {
      await client.query(
        `INSERT INTO reglas_menu (
          id, codigo, nombre, descripcion, tipo, naturaleza, estado, prioridad, peso,
          parametros, creado_por, actualizado_por, creado_en, actualizado_en
        )
        SELECT gen_random_uuid(), $1, $1, $2, $1, $3, 'ACTIVA', $4, $5, $6::jsonb, $7, $7, NOW(), NOW()
        WHERE NOT EXISTS (
          SELECT 1 FROM reglas_menu r WHERE r.codigo = $1 AND r.eliminado_en IS NULL
        )`,
        [
          codigo,
          `Regla inicial etapa 4: ${codigo}`,
          cfg.naturaleza,
          cfg.prioridad,
          cfg.peso,
          JSON.stringify(cfg.parametros),
          creadorId,
        ],
      );
    }

    // Insertar perfiles
    for (const [codigo, nombre, descripcion] of [
      [
        "EQUILIBRADO",
        "Perfil equilibrado",
        "Favorece variedad y restricciones mínimas",
      ],
      [
        "HISTORICO",
        "Perfil histórico",
        "Favorece patrones históricos por día con variedad mínima",
      ],
      [
        "RENOVACION",
        "Perfil renovación",
        "Favorece platos con mayor antigüedad o menor uso reciente",
      ],
    ]) {
      await client.query(
        `INSERT INTO perfiles_reglas (id, codigo, nombre, descripcion, estado, es_predeterminado, creado_por, actualizado_por, creado_en, actualizado_en)
        SELECT gen_random_uuid(), $1, $2, $3, 'ACTIVO', true, $4, $4, NOW(), NOW()
        WHERE NOT EXISTS (SELECT 1 FROM perfiles_reglas pr WHERE pr.codigo = $1 AND pr.eliminado_en IS NULL)`,
        [codigo, nombre, descripcion, creadorId],
      );
    }

    // Vincular reglas a perfiles
    await client.query(
      `INSERT INTO perfiles_reglas_detalle (id, perfil_id, regla_id, orden, activa, peso_personalizado, prioridad_personalizada, parametros_personalizados, creado_en, actualizado_en)
      SELECT
        gen_random_uuid(), pr.id, r.id,
        ROW_NUMBER() OVER (PARTITION BY pr.id ORDER BY r.prioridad DESC, r.codigo ASC),
        true,
        CASE WHEN pr.codigo = 'HISTORICO' AND r.codigo = 'PRIORIZAR_HISTORICO_POR_DIA' THEN 12
             WHEN pr.codigo = 'RENOVACION' AND r.codigo = 'PRIORIZAR_RENOVACION' THEN 12
             WHEN pr.codigo = 'RENOVACION' AND r.codigo = 'PRIORIZAR_PLATOS_MENOS_USADOS' THEN 10
             ELSE NULL END,
        NULL, NULL, NOW(), NOW()
      FROM perfiles_reglas pr
      JOIN reglas_menu r ON r.eliminado_en IS NULL
      WHERE pr.codigo IN ('EQUILIBRADO','HISTORICO','RENOVACION')
        AND NOT EXISTS (
          SELECT 1 FROM perfiles_reglas_detalle d WHERE d.perfil_id = pr.id AND d.regla_id = r.id
        )`,
    );

    // Verificar resultado
    const reglas = await client.query(
      "SELECT COUNT(*) as n FROM reglas_menu WHERE eliminado_en IS NULL",
    );
    const detalles = await client.query(
      "SELECT COUNT(*) as n FROM perfiles_reglas_detalle WHERE activa = true",
    );
    console.log(`[seed-reglas] Reglas activas: ${reglas.rows[0].n}`);
    console.log(
      `[seed-reglas] Detalles de perfil activos: ${detalles.rows[0].n}`,
    );
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("[seed-reglas] Error:", err.message);
  process.exit(1);
});
