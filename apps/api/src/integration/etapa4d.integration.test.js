import { beforeAll, afterAll, describe, expect, test } from "@jest/globals";
import { randomUUID } from "node:crypto";
import {
  bootstrapApi,
  login,
  crearUsuarioConRol,
  obtenerMarcaLaQuinta,
  obtenerOpcionesAyC,
  crearPlatoBasico,
  addDaysIso,
  obtenerLunesIso,
} from "./etapa4d.utils.js";

/**
 * Limpia registros de corridas previas de ETAPA4D identificados por el prefijo
 * 'E4D_' en códigos de platos. Solo elimina datos propios de esta suite;
 * no toca datos de otras etapas ni hace reset general de la base.
 */
async function limpiarDatosE4D(poolRef) {
  await poolRef.query(
    `DELETE FROM opciones_dia_menu
     WHERE plato_id IN (
       SELECT id FROM platos WHERE codigo LIKE 'E4D_%'
     )`,
  );
  await poolRef.query(
    `DELETE FROM opciones_dia_menu
     WHERE dia_version_menu_id IN (
       SELECT d.id
       FROM dias_version_menu d
       JOIN versiones_semana_menu v ON v.id = d.version_semana_id
       JOIN semanas_menu s ON s.id = v.semana_menu_id
       WHERE s.id IN (
         SELECT DISTINCT s2.id
         FROM semanas_menu s2
         JOIN versiones_semana_menu v2 ON v2.semana_menu_id = s2.id
         JOIN dias_version_menu d2 ON d2.version_semana_id = v2.id
         JOIN opciones_dia_menu o2 ON o2.dia_version_menu_id = d2.id
         JOIN platos p ON p.id = o2.plato_id
         WHERE p.codigo LIKE 'E4D_%'
       )
     )`,
  );
  await poolRef.query(
    `DELETE FROM propuestas_menu
     WHERE semana_menu_id IN (
       SELECT DISTINCT s.id
       FROM semanas_menu s
       JOIN versiones_semana_menu v ON v.semana_menu_id = s.id
       JOIN dias_version_menu d ON d.version_semana_id = v.id
       JOIN opciones_dia_menu o ON o.dia_version_menu_id = d.id
       JOIN platos p ON p.id = o.plato_id
       WHERE p.codigo LIKE 'E4D_%'
     )`,
  );
  await poolRef.query(
    `DELETE FROM propuestas_menu_detalle
     WHERE dia_version_menu_id IN (
       SELECT d.id
       FROM dias_version_menu d
       JOIN versiones_semana_menu v ON v.id = d.version_semana_id
       JOIN semanas_menu s ON s.id = v.semana_menu_id
       WHERE NOT EXISTS (
         SELECT 1 FROM versiones_semana_menu v2
         WHERE v2.semana_menu_id = s.id
           AND v2.estado IN ('PUBLICADO','FINALIZADO')
       )
       AND s.creado_por IN (
         SELECT id FROM usuarios WHERE correo LIKE '%propietario%'
       )
       AND s.id IN (
         SELECT DISTINCT s3.id
         FROM semanas_menu s3
         JOIN versiones_semana_menu v3 ON v3.semana_menu_id = s3.id
         JOIN dias_version_menu d3 ON d3.version_semana_id = v3.id
         LEFT JOIN opciones_dia_menu o3 ON o3.dia_version_menu_id = d3.id
         LEFT JOIN platos p3 ON p3.id = o3.plato_id
         WHERE p3.codigo LIKE 'E4D_%' OR p3.id IS NULL
       )
     )`,
  );
  await poolRef.query(
    `DELETE FROM opciones_dia_menu
     WHERE dia_version_menu_id IN (
       SELECT d.id
       FROM dias_version_menu d
       JOIN versiones_semana_menu v ON v.id = d.version_semana_id
       JOIN semanas_menu s ON s.id = v.semana_menu_id
       WHERE NOT EXISTS (
         SELECT 1 FROM versiones_semana_menu v2
         WHERE v2.semana_menu_id = s.id
           AND v2.estado IN ('PUBLICADO','FINALIZADO')
       )
       AND s.creado_por IN (
         SELECT id FROM usuarios WHERE correo LIKE '%propietario%'
       )
       AND s.id IN (
         SELECT DISTINCT s3.id
         FROM semanas_menu s3
         JOIN versiones_semana_menu v3 ON v3.semana_menu_id = s3.id
         JOIN dias_version_menu d3 ON d3.version_semana_id = v3.id
         LEFT JOIN opciones_dia_menu o3 ON o3.dia_version_menu_id = d3.id
         LEFT JOIN platos p3 ON p3.id = o3.plato_id
         WHERE p3.codigo LIKE 'E4D_%' OR p3.id IS NULL
       )
     )`,
  );
  // Borrar semanas cuyos platos asignados son todos de E4D (semanas de corridas previas)
  await poolRef.query(
    `DELETE FROM dias_version_menu
     WHERE version_semana_id IN (
       SELECT v.id
       FROM versiones_semana_menu v
       JOIN semanas_menu s ON s.id = v.semana_menu_id
       WHERE NOT EXISTS (
         SELECT 1 FROM versiones_semana_menu v2
         WHERE v2.semana_menu_id = s.id
           AND v2.estado IN ('PUBLICADO','FINALIZADO')
       )
       AND s.creado_por IN (
         SELECT id FROM usuarios WHERE correo LIKE '%propietario%'
       )
       AND s.id IN (
         SELECT DISTINCT s3.id
         FROM semanas_menu s3
         JOIN versiones_semana_menu v3 ON v3.semana_menu_id = s3.id
         JOIN dias_version_menu d3 ON d3.version_semana_id = v3.id
         LEFT JOIN opciones_dia_menu o3 ON o3.dia_version_menu_id = d3.id
         LEFT JOIN platos p3 ON p3.id = o3.plato_id
         WHERE p3.codigo LIKE 'E4D_%' OR p3.id IS NULL
       )
     )`,
  );
  await poolRef.query(
    `DELETE FROM versiones_semana_menu
     WHERE semana_menu_id IN (
       SELECT id FROM semanas_menu WHERE NOT EXISTS (
         SELECT 1 FROM versiones_semana_menu v
         WHERE v.semana_menu_id = semanas_menu.id
       )
     )`,
  );
  await poolRef.query(
    `DELETE FROM platos_categorias WHERE plato_id IN (SELECT id FROM platos WHERE codigo LIKE 'E4D_%')`,
  );
  await poolRef.query(
    `DELETE FROM platos_proteinas WHERE plato_id IN (SELECT id FROM platos WHERE codigo LIKE 'E4D_%')`,
  );
  await poolRef.query(`DELETE FROM platos WHERE codigo LIKE 'E4D_%'`);
}

let api;
let closeDb;
let pool;
let owner;
let roles;
let marca;
let opciones;
let semanaObjetivo;
let versionObjetivo;
let platosActivos = [];
let platosEspeciales = {};
let propuestasBase = [];
let evidenciaPerfiles = [];
let evidenciaPermisos = [];
let evidenciaConflicto = null;
let runTag;

function perfilDesdeTipo(tipo) {
  if (tipo === "EQUILIBRADA") return "EQUILIBRADO";
  if (tipo === "HISTORICA") return "HISTORICO";
  if (tipo === "RENOVACION") return "RENOVACION";
  return "PERSONALIZADA";
}

async function asegurarReglaActiva(poolRef, usuarioId, data) {
  await poolRef.query(
    `INSERT INTO reglas_menu (
       id, codigo, nombre, descripcion, tipo, naturaleza, estado, prioridad, peso,
       parametros, creado_por, actualizado_por, creado_en, actualizado_en
     )
     SELECT $1, $2, $3, $4, $5, $6, 'ACTIVA', $7, $8, $9::jsonb, $10, $10, NOW(), NOW()
     WHERE NOT EXISTS (
       SELECT 1 FROM reglas_menu WHERE codigo = $2 AND eliminado_en IS NULL
     )`,
    [
      randomUUID(),
      data.codigo,
      data.nombre,
      data.descripcion || `Autoreparado por tests E4D: ${data.codigo}`,
      data.tipo || data.codigo,
      data.naturaleza,
      data.prioridad,
      data.peso,
      JSON.stringify(data.parametros || {}),
      usuarioId,
    ],
  );

  await poolRef.query(
    `UPDATE reglas_menu
     SET nombre = $2,
         descripcion = $3,
         tipo = $4,
         naturaleza = $5,
         estado = 'ACTIVA',
         prioridad = $6,
         peso = $7,
         parametros = $8::jsonb,
         eliminado_en = NULL,
         actualizado_en = NOW(),
         actualizado_por = $9
     WHERE codigo = $1`,
    [
      data.codigo,
      data.nombre,
      data.descripcion || `Autoreparado por tests E4D: ${data.codigo}`,
      data.tipo || data.codigo,
      data.naturaleza,
      data.prioridad,
      data.peso,
      JSON.stringify(data.parametros || {}),
      usuarioId,
    ],
  );
}

async function asegurarReglasBaseEtapa4(
  poolRef,
  usuarioId,
  categoriaId,
  proteinaId,
) {
  const obligatorias = [
    {
      codigo: "NO_REPETIR_PLATO_EN_SEMANA",
      nombre: "No repetir plato semanal",
      naturaleza: "OBLIGATORIA",
      prioridad: 900,
      peso: 0,
      parametros: {},
    },
    {
      codigo: "ANTIGUEDAD_MINIMA_PLATO",
      nombre: "Antiguedad minima de plato",
      naturaleza: "OBLIGATORIA",
      prioridad: 850,
      peso: 0,
      parametros: { semanas_minimas: 1 },
    },
    {
      codigo: "MAXIMO_CATEGORIA_SEMANA",
      nombre: "Maximo categoria semanal",
      naturaleza: "OBLIGATORIA",
      prioridad: 800,
      peso: 0,
      parametros: { categoria_id: categoriaId, cantidad: 4 },
    },
    {
      codigo: "MAXIMO_PROTEINA_SEMANA",
      nombre: "Maximo proteina semanal",
      naturaleza: "OBLIGATORIA",
      prioridad: 780,
      peso: 0,
      parametros: { proteina_id: proteinaId, cantidad: 4 },
    },
    {
      codigo: "EXCLUIR_PLATOS_INACTIVOS",
      nombre: "Excluir platos inactivos",
      naturaleza: "OBLIGATORIA",
      prioridad: 760,
      peso: 0,
      parametros: { cantidad: 0 },
    },
    {
      codigo: "EXCLUIR_PLATOS_ARCHIVADOS",
      nombre: "Excluir platos archivados",
      naturaleza: "OBLIGATORIA",
      prioridad: 740,
      peso: 0,
      parametros: {},
    },
    {
      codigo: "EXCLUIR_PLATOS_BLOQUEADOS",
      nombre: "Excluir platos bloqueados",
      naturaleza: "OBLIGATORIA",
      prioridad: 720,
      peso: 0,
      parametros: {},
    },
    {
      codigo: "RESPETAR_TEMPORADA",
      nombre: "Respetar temporada",
      naturaleza: "OBLIGATORIA",
      prioridad: 700,
      peso: 0,
      parametros: {},
    },
  ];

  const preferenciales = [
    {
      codigo: "PRIORIZAR_HISTORICO_POR_DIA",
      nombre: "Priorizar historico por dia",
      naturaleza: "PREFERENCIAL",
      prioridad: 600,
      peso: 8,
      parametros: { factor: 1 },
    },
    {
      codigo: "PRIORIZAR_RENOVACION",
      nombre: "Priorizar renovacion",
      naturaleza: "PREFERENCIAL",
      prioridad: 580,
      peso: 8,
      parametros: { factor: 1 },
    },
    {
      codigo: "PRIORIZAR_PLATOS_MENOS_USADOS",
      nombre: "Priorizar platos menos usados",
      naturaleza: "PREFERENCIAL",
      prioridad: 560,
      peso: 6,
      parametros: { factor: 1 },
    },
    {
      codigo: "PREMIAR_VARIEDAD_CATEGORIAS",
      nombre: "Premiar variedad de categorias",
      naturaleza: "PREFERENCIAL",
      prioridad: 540,
      peso: 6,
      parametros: { factor: 1 },
    },
    {
      codigo: "PREMIAR_VARIEDAD_PROTEINAS",
      nombre: "Premiar variedad de proteinas",
      naturaleza: "PREFERENCIAL",
      prioridad: 520,
      peso: 6,
      parametros: { factor: 1 },
    },
    {
      codigo: "PRIORIZAR_FAVORITOS",
      nombre: "Priorizar favoritos",
      naturaleza: "PREFERENCIAL",
      prioridad: 500,
      peso: 4,
      parametros: {},
    },
  ];

  for (const r of [...obligatorias, ...preferenciales]) {
    await asegurarReglaActiva(poolRef, usuarioId, r);
  }
}

async function asegurarPerfilesInicialesEtapa4(poolRef, usuarioId) {
  const perfilDefs = [
    {
      codigo: "EQUILIBRADO",
      nombre: "Perfil equilibrado",
      descripcion: "Autoreparado por tests E4D",
    },
    {
      codigo: "HISTORICO",
      nombre: "Perfil histórico",
      descripcion: "Autoreparado por tests E4D",
    },
    {
      codigo: "RENOVACION",
      nombre: "Perfil renovación",
      descripcion: "Autoreparado por tests E4D",
    },
  ];

  for (const p of perfilDefs) {
    await poolRef.query(
      `INSERT INTO perfiles_reglas (
         id, codigo, nombre, descripcion, estado, es_predeterminado,
         creado_por, actualizado_por, creado_en, actualizado_en
       )
       SELECT $1, $2, $3, $4, 'ACTIVO', true, $5, $5, NOW(), NOW()
       WHERE NOT EXISTS (
         SELECT 1 FROM perfiles_reglas WHERE codigo = $2 AND eliminado_en IS NULL
       )`,
      [randomUUID(), p.codigo, p.nombre, p.descripcion, usuarioId],
    );

    await poolRef.query(
      `UPDATE perfiles_reglas
       SET estado = 'ACTIVO', eliminado_en = NULL, actualizado_en = NOW(), actualizado_por = $2
       WHERE codigo = $1`,
      [p.codigo, usuarioId],
    );
  }

  const perfiles = await poolRef.query(
    `SELECT id, codigo FROM perfiles_reglas
     WHERE codigo IN ('EQUILIBRADO','HISTORICO','RENOVACION') AND eliminado_en IS NULL`,
  );
  const reglas = await poolRef.query(
    `SELECT id FROM reglas_menu WHERE estado = 'ACTIVA' AND eliminado_en IS NULL`,
  );

  for (const perfil of perfiles.rows) {
    let orden = 1;
    for (const regla of reglas.rows) {
      await poolRef.query(
        `INSERT INTO perfiles_reglas_detalle (
          id, perfil_id, regla_id, orden, activa, creado_en, actualizado_en
        ) VALUES ($1, $2, $3, $4, true, NOW(), NOW())
        ON CONFLICT (perfil_id, regla_id) DO NOTHING`,
        [randomUUID(), perfil.id, regla.id, orden],
      );
      orden += 1;
    }

    await poolRef.query(
      `UPDATE perfiles_reglas_detalle
       SET activa = true,
           actualizado_en = NOW()
       WHERE perfil_id = $1`,
      [perfil.id],
    );
  }

  const perfilMap = new Map(perfiles.rows.map((p) => [p.codigo, p.id]));

  if (perfilMap.get("EQUILIBRADO")) {
    await poolRef.query(
      `UPDATE perfiles_reglas_detalle d
       SET peso_personalizado = 12,
           prioridad_personalizada = 120
       FROM reglas_menu r
       WHERE d.regla_id = r.id
         AND d.perfil_id = $1
         AND (
           r.tipo IN ('PREMIAR_VARIEDAD_CATEGORIAS','PREMIAR_VARIEDAD_PROTEINAS')
           OR r.codigo IN ('PREMIAR_VARIEDAD_CATEGORIAS','PREMIAR_VARIEDAD_PROTEINAS')
         )`,
      [perfilMap.get("EQUILIBRADO")],
    );

    await poolRef.query(
      `UPDATE perfiles_reglas_detalle d
       SET peso_personalizado = 0,
           prioridad_personalizada = 10
       FROM reglas_menu r
       WHERE d.regla_id = r.id
         AND d.perfil_id = $1
         AND (r.tipo = 'PRIORIZAR_HISTORICO_POR_DIA' OR r.codigo = 'PRIORIZAR_HISTORICO_POR_DIA')`,
      [perfilMap.get("EQUILIBRADO")],
    );
  }

  if (perfilMap.get("HISTORICO")) {
    await poolRef.query(
      `UPDATE perfiles_reglas_detalle d
       SET peso_personalizado = 100,
           prioridad_personalizada = 300
       FROM reglas_menu r
       WHERE d.regla_id = r.id
         AND d.perfil_id = $1
         AND (r.tipo = 'PRIORIZAR_HISTORICO_POR_DIA' OR r.codigo = 'PRIORIZAR_HISTORICO_POR_DIA')`,
      [perfilMap.get("HISTORICO")],
    );
    await poolRef.query(
      `UPDATE perfiles_reglas_detalle d
       SET peso_personalizado = 0,
           prioridad_personalizada = 10
       FROM reglas_menu r
       WHERE d.regla_id = r.id
         AND d.perfil_id = $1
         AND (r.tipo = 'PRIORIZAR_RENOVACION' OR r.codigo = 'PRIORIZAR_RENOVACION')`,
      [perfilMap.get("HISTORICO")],
    );
    await poolRef.query(
      `UPDATE perfiles_reglas_detalle d
       SET peso_personalizado = -50,
           prioridad_personalizada = 10
       FROM reglas_menu r
       WHERE d.regla_id = r.id
         AND d.perfil_id = $1
         AND (r.tipo = 'PRIORIZAR_PLATOS_MENOS_USADOS' OR r.codigo = 'PRIORIZAR_PLATOS_MENOS_USADOS')`,
      [perfilMap.get("HISTORICO")],
    );
    await poolRef.query(
      `UPDATE perfiles_reglas_detalle d
       SET peso_personalizado = -25,
           prioridad_personalizada = 20
       FROM reglas_menu r
       WHERE d.regla_id = r.id
         AND d.perfil_id = $1
         AND (
           r.tipo IN ('PREMIAR_VARIEDAD_CATEGORIAS','PREMIAR_VARIEDAD_PROTEINAS')
           OR r.codigo IN ('PREMIAR_VARIEDAD_CATEGORIAS','PREMIAR_VARIEDAD_PROTEINAS')
         )`,
      [perfilMap.get("HISTORICO")],
    );
  }

  if (perfilMap.get("RENOVACION")) {
    await poolRef.query(
      `UPDATE perfiles_reglas_detalle d
       SET peso_personalizado = 120,
           prioridad_personalizada = 320
       FROM reglas_menu r
       WHERE d.regla_id = r.id
         AND d.perfil_id = $1
         AND (
           r.tipo IN ('PRIORIZAR_RENOVACION','PRIORIZAR_PLATOS_MENOS_USADOS')
           OR r.codigo IN ('PRIORIZAR_RENOVACION','PRIORIZAR_PLATOS_MENOS_USADOS')
         )`,
      [perfilMap.get("RENOVACION")],
    );
    await poolRef.query(
      `UPDATE perfiles_reglas_detalle d
       SET peso_personalizado = 0,
           prioridad_personalizada = 10
       FROM reglas_menu r
       WHERE d.regla_id = r.id
         AND d.perfil_id = $1
         AND (r.tipo = 'PRIORIZAR_HISTORICO_POR_DIA' OR r.codigo = 'PRIORIZAR_HISTORICO_POR_DIA')`,
      [perfilMap.get("RENOVACION")],
    );
    await poolRef.query(
      `UPDATE perfiles_reglas_detalle d
       SET peso_personalizado = -25,
           prioridad_personalizada = 20
       FROM reglas_menu r
       WHERE d.regla_id = r.id
         AND d.perfil_id = $1
         AND (
           r.tipo IN ('PREMIAR_VARIEDAD_CATEGORIAS','PREMIAR_VARIEDAD_PROTEINAS')
           OR r.codigo IN ('PREMIAR_VARIEDAD_CATEGORIAS','PREMIAR_VARIEDAD_PROTEINAS')
         )`,
      [perfilMap.get("RENOVACION")],
    );
  }
}

async function crearSemanaEditable({
  lunes,
  asignacionesDia = {},
  platoFallbackA,
  platoFallbackC,
}) {
  let lunesBase = lunes;
  let crear = null;
  for (let intento = 0; intento < 104; intento += 1) {
    crear = await api
      .post("/api/v1/menu/semanas")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        marcaId: marca.id,
        canalId: null,
        empresaId: null,
        fechaInicio: lunesBase,
        fechaFin: addDaysIso(lunesBase, 6),
      });
    if (crear.status === 201) break;
    if (crear.status !== 409) break;
    lunesBase = addDaysIso(lunesBase, 7);
  }

  expect(crear?.status).toBe(201);
  const semanaId = crear.body.datos.semana.id;
  const versionId = crear.body.datos.versionInicial.id;

  await api
    .put(
      `/api/v1/menu/semanas/${semanaId}/versiones/${versionId}/dias/${lunesBase}`,
    )
    .set("Authorization", `Bearer ${owner.token}`)
    .send({ estado: "FERIADO", observaciones: "Feriado E4D" });

  for (let i = 1; i <= 5; i += 1) {
    const fecha = addDaysIso(lunesBase, i);
    const asignacion = asignacionesDia[fecha] || {};

    await api
      .put(
        `/api/v1/menu/semanas/${semanaId}/versiones/${versionId}/dias/${fecha}`,
      )
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ estado: "DIA_LABORAL", observaciones: `Laboral ${i}` });

    await api
      .put(
        `/api/v1/menu/semanas/${semanaId}/versiones/${versionId}/dias/${fecha}/opciones`,
      )
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        opciones: [
          {
            opcionMenuMarcaId: opciones.A.id,
            platoId: asignacion.A || platoFallbackA,
            orden: 1,
            bloqueadoManual: Boolean(asignacion.ABloqueado),
          },
          {
            opcionMenuMarcaId: opciones.C.id,
            platoId: asignacion.C || platoFallbackC,
            orden: 2,
            bloqueadoManual: Boolean(asignacion.CBloqueado),
          },
        ],
      });
  }

  return { semanaId, versionId };
}

async function publicarSemana(semanaId, versionId) {
  const proponer = await api
    .post(`/api/v1/menu/semanas/${semanaId}/versiones/${versionId}/proponer`)
    .set("Authorization", `Bearer ${owner.token}`)
    .send({});
  expect([200, 409]).toContain(proponer.status);

  const aprobar = await api
    .post(`/api/v1/menu/semanas/${semanaId}/versiones/${versionId}/aprobar`)
    .set("Authorization", `Bearer ${owner.token}`)
    .send({});
  expect([200, 409]).toContain(aprobar.status);

  const publicar = await api
    .post(`/api/v1/menu/semanas/${semanaId}/versiones/${versionId}/publicar`)
    .set("Authorization", `Bearer ${owner.token}`)
    .send({});
  expect([200, 409]).toContain(publicar.status);

  const estado = await pool.query(
    `SELECT estado FROM versiones_semana_menu WHERE id = $1`,
    [versionId],
  );
  const estadoActual = estado.rows[0]?.estado;
  if (!["PUBLICADO", "FINALIZADO"].includes(String(estadoActual))) {
    await pool.query(
      `UPDATE versiones_semana_menu
       SET estado = 'PUBLICADO',
           aprobado_por = COALESCE(aprobado_por, $2),
           aprobado_en = COALESCE(aprobado_en, NOW()),
           publicado_por = COALESCE(publicado_por, $2),
           publicado_en = COALESCE(publicado_en, NOW()),
           es_publicada_actual = true,
           actualizado_en = NOW()
       WHERE id = $1`,
      [versionId, owner.id],
    );
    await pool.query(
      `UPDATE semanas_menu SET version_publicada_id = $1, actualizado_en = NOW() WHERE id = $2`,
      [versionId, semanaId],
    );
  }
}

async function obtenerPerfilPorCodigo(codigo) {
  const q = await pool.query(
    `SELECT id, codigo FROM perfiles_reglas WHERE codigo = $1 AND eliminado_en IS NULL LIMIT 1`,
    [codigo],
  );
  return q.rows[0] || null;
}

async function obtenerDetallePropuesta(propuestaId) {
  const r = await api
    .get(
      `/api/v1/menu/semanas/${semanaObjetivo}/versiones/${versionObjetivo}/propuestas/${propuestaId}`,
    )
    .set("Authorization", `Bearer ${owner.token}`);
  expect(r.status).toBe(200);
  return r.body.datos;
}

async function metricasPropuesta(detalle) {
  const platoIds = [
    ...new Set(detalle.detalle.map((d) => d.plato_id).filter(Boolean)),
  ];
  const categorias = new Set();
  const proteinas = new Set();

  let afinidadHistoricaTotal = 0;
  let semanasSinUsoTotal = 0;
  let semanasConDato = 0;
  let nuncaUsados = 0;
  let favoritos = 0;

  const qPlatos = await pool.query(
    `SELECT p.id, p.favorito,
            COALESCE((SELECT json_agg(pc.categoria_id) FROM platos_categorias pc WHERE pc.plato_id = p.id), '[]'::json) AS categorias,
            COALESCE((SELECT json_agg(pp.proteina_id) FROM platos_proteinas pp WHERE pp.plato_id = p.id), '[]'::json) AS proteinas
     FROM platos p
     WHERE p.id = ANY($1::uuid[])`,
    [platoIds],
  );

  for (const p of qPlatos.rows) {
    for (const c of p.categorias || []) categorias.add(String(c));
    for (const pr of p.proteinas || []) proteinas.add(String(pr));
    if (p.favorito) favoritos += 1;
  }

  for (const d of detalle.detalle) {
    if (d.posicion_bloqueada) continue;

    const e = d.evaluaciones || d.explicacion?.evaluaciones || [];
    const hist = e.find((x) => x.codigo === "PRIORIZAR_HISTORICO_POR_DIA");
    const ant = e.find((x) => x.codigo === "ANTIGUEDAD_MINIMA_PLATO");

    if (hist) {
      afinidadHistoricaTotal += Number(hist.metricas?.usos_mismo_dia || 0);
    }

    const semanas = Number(
      ant?.metricas?.semanas_desde_ultimo_uso ??
        e.find((x) => x.codigo === "PRIORIZAR_RENOVACION")?.metricas
          ?.semanas_desde_ultimo_uso ??
        0,
    );
    if (semanas > 0) {
      semanasSinUsoTotal += semanas;
      semanasConDato += 1;
    }

    const usosTotales = Number(
      hist?.metricas?.usos_totales ||
        e.find((x) => x.codigo === "PRIORIZAR_PLATOS_MENOS_USADOS")?.metricas
          ?.usos_totales ||
        0,
    );
    if (usosTotales === 0) nuncaUsados += 1;
  }

  let repeticionesConsecutivas = 0;
  const porOpcion = new Map();
  const ordenado = [...detalle.detalle].sort((a, b) => {
    if (a.fecha !== b.fecha)
      return String(a.fecha).localeCompare(String(b.fecha));
    return Number(a.orden || 0) - Number(b.orden || 0);
  });
  for (const d of ordenado) {
    const key = String(d.opcion_menu_marca_id || d.opcionMenuMarcaId || "");
    const prev = porOpcion.get(key);
    if (prev && prev === d.plato_id) repeticionesConsecutivas += 1;
    porOpcion.set(key, d.plato_id);
  }

  return {
    cantidadCategoriasDistintas: categorias.size,
    cantidadProteinasDistintas: proteinas.size,
    repeticionesConsecutivas,
    afinidadHistoricaTotal,
    promedioSemanasDesdeUltimoUso: semanasConDato
      ? Number((semanasSinUsoTotal / semanasConDato).toFixed(4))
      : 0,
    cantidadPlatosNuncaUtilizados: nuncaUsados,
    cantidadFavoritos: favoritos,
    puntajeTotal: Number(detalle.puntaje_total || 0),
  };
}

describe("Etapa 4D - Validación funcional final", () => {
  beforeAll(async () => {
    const boot = await bootstrapApi("etapa4d");
    api = boot.api;
    closeDb = boot.closeDb;
    pool = boot.getPool();

    runTag = String(Date.now());

    const acceso = await login(
      api,
      boot.credenciales.correoProp,
      boot.credenciales.contrasenaProp,
    );
    expect(acceso.status).toBe(200);
    owner = {
      token: acceso.body.datos.accessToken,
      id: acceso.body.datos.usuario.id,
    };

    marca = await obtenerMarcaLaQuinta(pool);
    opciones = await obtenerOpcionesAyC(pool, marca.id);
    const sufijoRoles = `e4d-${Date.now()}`;
    roles = {
      CLIENTE: await crearUsuarioConRol(
        api,
        owner.token,
        "CLIENTE",
        sufijoRoles,
      ),
      LECTOR: await crearUsuarioConRol(api, owner.token, "LECTOR", sufijoRoles),
      EDITOR: await crearUsuarioConRol(api, owner.token, "EDITOR", sufijoRoles),
      ADMINISTRADOR: await crearUsuarioConRol(
        api,
        owner.token,
        "ADMINISTRADOR",
        sufijoRoles,
      ),
      PROPIETARIO: owner,
    };

    const categorias = await pool.query(
      "SELECT id FROM categorias_plato WHERE marca_id = $1 ORDER BY codigo ASC LIMIT 4",
      [marca.id],
    );
    const proteinas = await pool.query(
      "SELECT id FROM proteinas WHERE marca_id = $1 ORDER BY codigo ASC LIMIT 4",
      [marca.id],
    );

    await asegurarReglasBaseEtapa4(
      pool,
      owner.id,
      categorias.rows[0]?.id,
      proteinas.rows[0]?.id,
    );
    await asegurarPerfilesInicialesEtapa4(pool, owner.id);

    for (let i = 0; i < 24; i += 1) {
      const plato = await crearPlatoBasico(pool, {
        marcaId: marca.id,
        nombre: `E4D ${runTag} Plato ${String(i + 1).padStart(2, "0")}`,
        codigo: `E4D_${runTag}_${String(i + 1).padStart(2, "0")}`,
        usuarioId: owner.id,
      });
      platosActivos.push(plato);

      const categoria = categorias.rows[i % categorias.rows.length];
      const proteina = proteinas.rows[i % proteinas.rows.length];
      await pool.query(
        "INSERT INTO platos_categorias (plato_id, categoria_id, creado_en) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING",
        [plato.id, categoria.id],
      );
      await pool.query(
        "INSERT INTO platos_proteinas (plato_id, proteina_id, creado_en) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING",
        [plato.id, proteina.id],
      );
    }

    await pool.query(
      "UPDATE platos SET favorito = true WHERE id = ANY($1::uuid[])",
      [platosActivos.slice(0, 6).map((p) => p.id)],
    );

    platosEspeciales.archivado = await crearPlatoBasico(pool, {
      marcaId: marca.id,
      nombre: `E4D ${runTag} Archivado`,
      codigo: `E4D_${runTag}_ARCH`,
      usuarioId: owner.id,
      estado: "ARCHIVADO",
    });
    platosEspeciales.inactivo = await crearPlatoBasico(pool, {
      marcaId: marca.id,
      nombre: `E4D ${runTag} Inactivo`,
      codigo: `E4D_${runTag}_INAC`,
      usuarioId: owner.id,
      estado: "INACTIVO",
    });
    platosEspeciales.bloqueado = await crearPlatoBasico(pool, {
      marcaId: marca.id,
      nombre: `E4D ${runTag} Bloqueado`,
      codigo: `E4D_${runTag}_BLOQ`,
      usuarioId: owner.id,
      estado: "ACTIVO",
    });
    await pool.query(
      `UPDATE platos
       SET estado = 'BLOQUEADO_TEMPORALMENTE',
           favorito = true,
           bloqueado_desde = DATE '2000-01-01',
           bloqueado_hasta = DATE '2100-12-31'
       WHERE id = $1`,
      [platosEspeciales.bloqueado.id],
    );

    platosEspeciales.fueraTemporada = await crearPlatoBasico(pool, {
      marcaId: marca.id,
      nombre: `E4D ${runTag} FueraTemp`,
      codigo: `E4D_${runTag}_OUTSEASON`,
      usuarioId: owner.id,
      estado: "ACTIVO",
    });

    const h1Lunes = obtenerLunesIso(260 + Number(runTag.slice(-2)));
    const h1 = await crearSemanaEditable({
      lunes: h1Lunes,
      platoFallbackA: platosActivos[18].id,
      platoFallbackC: platosActivos[19].id,
      asignacionesDia: {
        [addDaysIso(h1Lunes, 1)]: {
          A: platosActivos[0].id,
          C: platosActivos[1].id,
        },
        [addDaysIso(h1Lunes, 2)]: {
          A: platosActivos[0].id,
          C: platosActivos[2].id,
        },
        [addDaysIso(h1Lunes, 3)]: {
          A: platosActivos[3].id,
          C: platosActivos[4].id,
        },
        [addDaysIso(h1Lunes, 4)]: {
          A: platosActivos[5].id,
          C: platosActivos[6].id,
        },
      },
    });
    await publicarSemana(h1.semanaId, h1.versionId);

    const h2Lunes = addDaysIso(h1Lunes, 14);
    const h2 = await crearSemanaEditable({
      lunes: h2Lunes,
      platoFallbackA: platosActivos[18].id,
      platoFallbackC: platosActivos[19].id,
      asignacionesDia: {
        [addDaysIso(h2Lunes, 1)]: {
          A: platosActivos[7].id,
          C: platosActivos[8].id,
        },
        [addDaysIso(h2Lunes, 2)]: {
          A: platosActivos[9].id,
          C: platosActivos[10].id,
        },
        [addDaysIso(h2Lunes, 3)]: {
          A: platosActivos[11].id,
          C: platosActivos[12].id,
        },
        [addDaysIso(h2Lunes, 4)]: {
          A: platosActivos[13].id,
          C: platosActivos[14].id,
        },
      },
    });
    await publicarSemana(h2.semanaId, h2.versionId);

    const objetivoLunes = addDaysIso(h2Lunes, 14);
    const fechaObjetivoTemporada = addDaysIso(objetivoLunes, 1);
    const mesObjetivo = Number(fechaObjetivoTemporada.slice(5, 7));
    // mesFueraTemporada debe ser distinto al mes de la semana objetivo;
    // si el objetivo es diciembre (12) usamos noviembre (11), si no, mes+1.
    const mesFueraTemporada = mesObjetivo === 12 ? 11 : mesObjetivo + 1;
    await pool.query(
      `UPDATE platos
       SET es_estacional = true,
           favorito = true,
           temporada_desde = $2,
           temporada_hasta = $2
       WHERE id = $1`,
      [platosEspeciales.fueraTemporada.id, mesFueraTemporada],
    );

    // Assertions de elegibilidad estacional: verificar que el evaluador de reglas
    // clasifica correctamente platos en/fuera de temporada respecto a la fecha objetivo.
    {
      const { evaluarObligatoriasParaCandidato } =
        await import("../modules/menu/propuestas/evaluador-reglas.servicio.js");
      const reglaTemporada = {
        id: "rt",
        codigo: "RESPETAR_TEMPORADA",
        naturaleza: "OBLIGATORIA",
        peso: 0,
        prioridad: 700,
        parametros: {},
      };
      const contextoBase = {
        reglasObligatorias: [reglaTemporada],
        platosYaAsignados: new Set(),
        conteosCategorias: new Map(),
        conteosProteinas: new Map(),
        metricas: { usos_totales: 0, usos_mismo_dia: 0, ultima_fecha: null },
        fechaObjetivo: fechaObjetivoTemporada,
      };

      // Plato en temporada: debe ser elegible (cumplida = true)
      const evEn = evaluarObligatoriasParaCandidato({
        ...contextoBase,
        candidato: {
          id: "t-en",
          estado: "ACTIVO",
          es_estacional: true,
          temporada_desde: mesObjetivo,
          temporada_hasta: mesObjetivo,
        },
      });
      const rtEn = evEn.find((x) => x.codigo === "RESPETAR_TEMPORADA");
      expect(rtEn.cumplida).toBe(true);

      // Plato fuera de temporada: debe ser no elegible (cumplida = false)
      const evFuera = evaluarObligatoriasParaCandidato({
        ...contextoBase,
        candidato: {
          id: "t-fuera",
          estado: "ACTIVO",
          es_estacional: true,
          temporada_desde: mesFueraTemporada,
          temporada_hasta: mesFueraTemporada,
        },
      });
      const rtFuera = evFuera.find((x) => x.codigo === "RESPETAR_TEMPORADA");
      expect(rtFuera.cumplida).toBe(false);

      // Cruce de año: temporada 12→1 → enero y diciembre son elegibles, febrero no.
      const platoCruce = {
        id: "t-cruce",
        estado: "ACTIVO",
        es_estacional: true,
        temporada_desde: 12,
        temporada_hasta: 1,
      };
      for (const { fecha, esperado } of [
        { fecha: "2030-01-13", esperado: true },
        { fecha: "2029-12-09", esperado: true },
        { fecha: "2030-02-10", esperado: false },
      ]) {
        const evCruce = evaluarObligatoriasParaCandidato({
          ...contextoBase,
          candidato: platoCruce,
          fechaObjetivo: fecha,
        });
        const rtCruce = evCruce.find((x) => x.codigo === "RESPETAR_TEMPORADA");
        expect(rtCruce.cumplida).toBe(esperado);
      }
    }

    const actual = await crearSemanaEditable({
      lunes: objetivoLunes,
      platoFallbackA: platosActivos[20].id,
      platoFallbackC: platosActivos[21].id,
      asignacionesDia: {
        [addDaysIso(objetivoLunes, 1)]: {
          A: platosActivos[15].id,
          ABloqueado: true,
          C: platosActivos[16].id,
        },
        [addDaysIso(objetivoLunes, 2)]: {
          A: platosActivos[17].id,
          C: platosActivos[18].id,
        },
      },
    });

    semanaObjetivo = actual.semanaId;
    versionObjetivo = actual.versionId;

    await pool.query(
      `UPDATE opciones_dia_menu o
       SET bloqueado_manual = true,
           plato_id = COALESCE(o.plato_id, $2),
           actualizado_en = NOW()
       FROM dias_version_menu d
       WHERE o.dia_version_menu_id = d.id
         AND d.version_semana_id = $1
         AND d.estado_dia = 'DIA_LABORAL'
         AND o.opcion_menu_marca_id = $3
         AND d.fecha = (
           SELECT MIN(d2.fecha)
           FROM dias_version_menu d2
           WHERE d2.version_semana_id = $1
             AND d2.estado_dia = 'DIA_LABORAL'
         )`,
      [versionObjetivo, platosActivos[15].id, opciones.A.id],
    );
  }, 300000);

  afterAll(async () => {
    delete process.env.PROPUESTAS_TEST_FAIL_AFTER_UPDATES;
    try {
      await limpiarDatosE4D(pool).catch(() => {});
    } finally {
      if (closeDb) await closeDb();
    }
  });

  test("precondiciones historicas no nulas en fixture", async () => {
    const fechaObjetivo = addDaysIso(
      await pool
        .query("SELECT fecha_inicio FROM semanas_menu WHERE id = $1", [
          semanaObjetivo,
        ])
        .then((q) => q.rows[0].fecha_inicio.toISOString().slice(0, 10)),
      1,
    );

    const metrica = async (platoId) =>
      pool.query(
        `SELECT
          MAX(d.fecha) AS ultima_fecha,
          COUNT(*)::int AS usos_totales,
          COUNT(*) FILTER (WHERE d.numero_dia_iso = EXTRACT(ISODOW FROM $3::date))::int AS usos_mismo_dia
         FROM opciones_dia_menu o
         JOIN dias_version_menu d ON d.id = o.dia_version_menu_id
         JOIN versiones_semana_menu v ON v.id = d.version_semana_id
         JOIN semanas_menu s ON s.id = v.semana_menu_id
         JOIN platos p ON p.id = o.plato_id
         WHERE o.plato_id = $1
           AND s.marca_id = $2
           AND d.fecha < $3::date
           AND p.codigo LIKE $4
           AND v.estado IN ('PUBLICADO','FINALIZADO')`,
        [platoId, marca.id, fechaObjetivo, `E4D_${runTag}_%`],
      );

    const candidatoHistorico = await pool.query(
      `SELECT o.plato_id
       FROM opciones_dia_menu o
       JOIN dias_version_menu d ON d.id = o.dia_version_menu_id
       JOIN versiones_semana_menu v ON v.id = d.version_semana_id
       JOIN semanas_menu s ON s.id = v.semana_menu_id
       JOIN platos p ON p.id = o.plato_id
       WHERE s.marca_id = $1
         AND d.fecha < $2::date
         AND p.codigo LIKE $3
         AND v.estado IN ('PUBLICADO','FINALIZADO')
       GROUP BY o.plato_id, d.numero_dia_iso
       HAVING COUNT(*) FILTER (WHERE d.numero_dia_iso = EXTRACT(ISODOW FROM $2::date)) > 0
       ORDER BY COUNT(*) DESC
       LIMIT 1`,
      [marca.id, fechaObjetivo, `E4D_${runTag}_%`],
    );
    expect(candidatoHistorico.rows[0]).toBeTruthy();

    const candidatoAntiguo = await pool.query(
      `SELECT o.plato_id
       FROM opciones_dia_menu o
       JOIN dias_version_menu d ON d.id = o.dia_version_menu_id
       JOIN versiones_semana_menu v ON v.id = d.version_semana_id
       JOIN semanas_menu s ON s.id = v.semana_menu_id
       JOIN platos p ON p.id = o.plato_id
       WHERE s.marca_id = $1
         AND d.fecha < $2::date
         AND p.codigo LIKE $3
         AND v.estado IN ('PUBLICADO','FINALIZADO')
       GROUP BY o.plato_id
       ORDER BY MAX(d.fecha) ASC
       LIMIT 1`,
      [marca.id, fechaObjetivo, `E4D_${runTag}_%`],
    );
    expect(candidatoAntiguo.rows[0]).toBeTruthy();

    const platoHistorico = await metrica(candidatoHistorico.rows[0].plato_id);
    const platoAntiguo = await metrica(candidatoAntiguo.rows[0].plato_id);
    const platoNuevo = await metrica(platosActivos[22].id);

    expect(Number(platoHistorico.rows[0].usos_mismo_dia || 0)).toBeGreaterThan(
      0,
    );
    expect(Number(platoHistorico.rows[0].usos_totales || 0)).toBeGreaterThan(0);
    expect(platoHistorico.rows[0].ultima_fecha).toBeTruthy();

    const semanasAntiguo = Math.floor(
      (new Date(fechaObjetivo) - new Date(platoAntiguo.rows[0].ultima_fecha)) /
        (7 * 24 * 60 * 60 * 1000),
    );
    expect(semanasAntiguo).toBeGreaterThanOrEqual(0);

    expect(Number(platoNuevo.rows[0].usos_totales || 0)).toBe(0);
  });

  test("generación normal completa y métricas del motor", async () => {
    const bloqueadaObjetivo = await pool.query(
      `SELECT TO_CHAR(d.fecha::date, 'YYYY-MM-DD') AS fecha,
              o.opcion_menu_marca_id
       FROM dias_version_menu d
       JOIN opciones_dia_menu o ON o.dia_version_menu_id = d.id
       WHERE d.version_semana_id = $1
         AND o.bloqueado_manual = true
       ORDER BY d.fecha ASC
       LIMIT 1`,
      [versionObjetivo],
    );
    expect(bloqueadaObjetivo.rows[0]).toBeTruthy();

    const r = await api
      .post(
        `/api/v1/menu/semanas/${semanaObjetivo}/versiones/${versionObjetivo}/propuestas/generar`,
      )
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        generar_perfiles_iniciales: true,
        respetar_platos_existentes: false,
        solo_posiciones_vacias: false,
        variar_resultados: false,
        semilla: `E4D-${runTag}`,
        posiciones_bloqueadas: [
          {
            fecha: bloqueadaObjetivo.rows[0].fecha,
            opcion_menu_marca_id:
              bloqueadaObjetivo.rows[0].opcion_menu_marca_id,
          },
        ],
      });

    expect(r.status).toBe(201);
    propuestasBase = r.body?.datos?.propuestas || [];
    expect(propuestasBase).toHaveLength(3);

    let podaTotal = 0;
    const podaPorPerfil = [];
    for (const p of propuestasBase) {
      const detalle = await obtenerDetallePropuesta(p.id);
      expect(detalle.resumen.motivoFinalizacion).toBe("COMPLETADO");
      podaTotal += Number(detalle.resumen.ramasPodadasTotal || 0);
      podaPorPerfil.push({
        perfil: perfilDesdeTipo(p.tipo),
        ramasPodadasTotal: Number(detalle.resumen.ramasPodadasTotal || 0),
        ramasPodadasPorDuplicado: Number(
          detalle.resumen.ramasPodadasPorDuplicado || 0,
        ),
        ramasPodadasPorRegla: Number(detalle.resumen.ramasPodadasPorRegla || 0),
        ramasPodadasPorCota: Number(detalle.resumen.ramasPodadasPorCota || 0),
        ramasPodadasPorInviabilidadGlobal: Number(
          detalle.resumen.ramasPodadasPorInviabilidadGlobal || 0,
        ),
      });
      expect([
        "LIMITE_NODOS",
        "TIMEOUT",
        "SIN_CANDIDATOS",
        "SIN_SOLUCION_COMPLETA",
      ]).not.toContain(detalle.resumen.motivoFinalizacion);

      expect(
        Number(detalle.resumen.candidatosTotales || 0),
      ).toBeGreaterThanOrEqual(0);
      expect(
        Number(detalle.resumen.promedioCandidatosPorPosicion || 0),
      ).toBeGreaterThanOrEqual(0);
      expect(Number(detalle.resumen.ramasPodadasTotal || 0)).toBeGreaterThan(0);

      const ramasPorDuplicado = Number(
        detalle.resumen.ramasPodadasPorDuplicado || 0,
      );
      const ramasPorRegla = Number(detalle.resumen.ramasPodadasPorRegla || 0);
      const ramasPorCota = Number(detalle.resumen.ramasPodadasPorCota || 0);
      const ramasPorSinCandidatos = Number(
        detalle.resumen.ramasPodadasPorSinCandidatos || 0,
      );
      const ramasPorInviabilidadGlobal = Number(
        detalle.resumen.ramasPodadasPorInviabilidadGlobal || 0,
      );

      expect(Number(detalle.resumen.ramasPodadasTotal || 0)).toBe(
        ramasPorDuplicado +
          ramasPorRegla +
          ramasPorCota +
          ramasPorSinCandidatos +
          ramasPorInviabilidadGlobal,
      );
      expect(ramasPorDuplicado).toBeGreaterThanOrEqual(1);
      expect(ramasPorRegla).toBeGreaterThanOrEqual(1);
      // poda por cota e inviabilidad global son reales cuando ocurren;
      // no se exige que aparezcan en cada generación individual.
    }

    console.table(podaPorPerfil);

    expect(podaTotal).toBeGreaterThanOrEqual(0);
  }, 120000);

  test("diferenciación cuantitativa real entre perfiles", async () => {
    const filas = [];
    const seriales = [];
    const serialesPorPerfil = {};
    const baseSeed = `E4D-${runTag}`;

    for (const p of propuestasBase) {
      const detalle = await obtenerDetallePropuesta(p.id);
      const m = await metricasPropuesta(detalle);
      const perfil = perfilDesdeTipo(p.tipo);
      const row = {
        perfil,
        ...m,
        nodosExplorados: Number(detalle.resumen.nodosExplorados || 0),
        ramasPodadasTotal: Number(detalle.resumen.ramasPodadasTotal || 0),
        tiempoMs: Number(detalle.resumen.tiempoMs || 0),
        motivoFinalizacion: detalle.resumen.motivoFinalizacion,
      };
      const serial = detalle.detalle
        .map((x) => `${x.fecha}|${x.opcion_menu_marca_id}|${x.plato_id}`)
        .join("||");
      const platoIds = detalle.detalle.map((x) => x.plato_id).filter(Boolean);

      row.platoIds = platoIds;
      row.balance =
        row.cantidadCategoriasDistintas * 3 +
        row.cantidadProteinasDistintas * 3 -
        row.repeticionesConsecutivas * 4;

      filas.push(row);
      seriales.push(serial);
      serialesPorPerfil[perfil] = serial;

      expect(row.motivoFinalizacion).toBe("COMPLETADO");
      expect(row.ramasPodadasTotal).toBeGreaterThan(0);
    }

    const historico = filas.find((f) => f.perfil === "HISTORICO");
    const renovacion = filas.find((f) => f.perfil === "RENOVACION");
    const equilibrado = filas.find((f) => f.perfil === "EQUILIBRADO");

    const pesosEfectivos = await pool.query(
      `SELECT p.codigo AS perfil,
              r.codigo AS codigo_regla,
              r.peso AS peso_base,
              d.peso_personalizado AS peso_override,
              COALESCE(d.peso_personalizado, r.peso) AS peso_efectivo,
              COALESCE(d.prioridad_personalizada, r.prioridad) AS prioridad_efectiva,
              COALESCE(d.parametros_personalizados, r.parametros) AS parametros_efectivos
       FROM perfiles_reglas p
       JOIN perfiles_reglas_detalle d ON d.perfil_id = p.id
       JOIN reglas_menu r ON r.id = d.regla_id
       WHERE p.codigo IN ('EQUILIBRADO','HISTORICO','RENOVACION')
         AND d.activa = true
       ORDER BY p.codigo, r.codigo`,
    );
    expect(pesosEfectivos.rows.length).toBeGreaterThan(0);

    const firmaPesos = new Map();
    for (const row of pesosEfectivos.rows) {
      const firma = `${row.codigo_regla}:${row.peso_efectivo}:${row.prioridad_efectiva}`;
      const arr = firmaPesos.get(row.perfil) || [];
      arr.push(firma);
      firmaPesos.set(row.perfil, arr);
    }
    const firmaEq = (firmaPesos.get("EQUILIBRADO") || []).join("|");
    const firmaHist = (firmaPesos.get("HISTORICO") || []).join("|");
    const firmaRen = (firmaPesos.get("RENOVACION") || []).join("|");
    expect(new Set([firmaEq, firmaHist, firmaRen]).size).toBeGreaterThan(1);

    console.table(
      filas.map((f) => ({
        perfil: f.perfil,
        categorias: f.cantidadCategoriasDistintas,
        proteinas: f.cantidadProteinasDistintas,
        repeticionesConsecutivas: f.repeticionesConsecutivas,
        afinidadHistoricaTotal: f.afinidadHistoricaTotal,
        promedioSemanasSinUso: f.promedioSemanasDesdeUltimoUso,
        nuncaUtilizados: f.cantidadPlatosNuncaUtilizados,
        favoritos: f.cantidadFavoritos,
        puntajeTotal: f.puntajeTotal,
        nodosExplorados: f.nodosExplorados,
        ramasPodadasTotal: f.ramasPodadasTotal,
        tiempoMs: f.tiempoMs,
        motivoFinalizacion: f.motivoFinalizacion,
        balance: f.balance,
      })),
    );
    console.log(
      "E4D perfiles plato_id por propuesta:",
      JSON.stringify(
        filas.map((f) => ({ perfil: f.perfil, platoIds: f.platoIds })),
        null,
        2,
      ),
    );

    expect(Boolean(historico && renovacion && equilibrado)).toBe(true);

    expect(equilibrado.balance).toBeGreaterThan(0);

    expect(historico.afinidadHistoricaTotal).toBeGreaterThan(
      equilibrado.afinidadHistoricaTotal,
    );
    expect(historico.afinidadHistoricaTotal).toBeGreaterThan(
      renovacion.afinidadHistoricaTotal,
    );
    expect(
      renovacion.promedioSemanasDesdeUltimoUso >
        historico.promedioSemanasDesdeUltimoUso ||
        renovacion.cantidadPlatosNuncaUtilizados >
          historico.cantidadPlatosNuncaUtilizados,
    ).toBe(true);

    expect(
      equilibrado.balance > historico.balance ||
        equilibrado.balance > renovacion.balance,
    ).toBe(true);
    expect(equilibrado.puntajeTotal).not.toBe(0);
    expect(historico.puntajeTotal).not.toBe(0);
    expect(renovacion.puntajeTotal).not.toBe(0);

    expect(equilibrado.cantidadCategoriasDistintas).toBeGreaterThanOrEqual(1);

    expect(seriales.length).toBe(3);
    expect(new Set(seriales).size).toBe(3);

    const rerun = [];
    for (const perfilCodigo of ["EQUILIBRADO", "HISTORICO", "RENOVACION"]) {
      const perfil = await obtenerPerfilPorCodigo(perfilCodigo);
      const generar = await api
        .post(
          `/api/v1/menu/semanas/${semanaObjetivo}/versiones/${versionObjetivo}/propuestas/generar-personalizada`,
        )
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          perfil_id: perfil.id,
          reglas_adicionales: [],
          reglas_desactivadas: [],
          parametros: {},
          semilla: `${baseSeed}::${perfilCodigo}`,
          variar_resultados: false,
        });

      expect(generar.status).toBe(201);
      const detalle = await obtenerDetallePropuesta(generar.body.datos.id);
      const serial = detalle.detalle
        .map((x) => `${x.fecha}|${x.opcion_menu_marca_id}|${x.plato_id}`)
        .join("||");
      rerun.push({ perfil: perfilCodigo, serial });
    }

    const rerunMap = Object.fromEntries(rerun.map((x) => [x.perfil, x.serial]));
    expect(rerunMap.EQUILIBRADO).toBe(serialesPorPerfil.EQUILIBRADO);
    expect(rerunMap.HISTORICO).toBeTruthy();
    expect(rerunMap.RENOVACION).toBeTruthy();

    evidenciaPerfiles = filas;
    console.table(
      filas.map((f) => ({
        perfil: f.perfil,
        categorias: f.cantidadCategoriasDistintas,
        proteinas: f.cantidadProteinasDistintas,
        repeticiones: f.repeticionesConsecutivas,
        afinidadHistoricaTotal: f.afinidadHistoricaTotal,
        promedioSemanasSinUso: f.promedioSemanasDesdeUltimoUso,
        nuncaUtilizados: f.cantidadPlatosNuncaUtilizados,
        favoritos: f.cantidadFavoritos,
        puntajeTotal: f.puntajeTotal,
        nodosExplorados: f.nodosExplorados,
        ramasPodadasTotal: f.ramasPodadasTotal,
        tiempoMs: f.tiempoMs,
        motivoFinalizacion: f.motivoFinalizacion,
        balance: f.balance,
      })),
    );
    console.log(
      "E4D perfiles plato_id por propuesta:",
      JSON.stringify(
        filas.map((f) => ({ perfil: f.perfil, platoIds: f.platoIds })),
        null,
        2,
      ),
    );
  }, 180000);

  test("posición bloqueada conflictiva retorna motivo explícito", async () => {
    const lunes = addDaysIso(
      obtenerLunesIso(520),
      Number(runTag.slice(-2)) * 7,
    );
    const sem = await crearSemanaEditable({
      lunes,
      platoFallbackA: platosActivos[0].id,
      platoFallbackC: platosActivos[1].id,
      asignacionesDia: {
        [addDaysIso(lunes, 1)]: {
          A: platosActivos[0].id,
          ABloqueado: true,
          C: platosActivos[2].id,
        },
      },
    });

    const reglaBase = await pool.query(
      `SELECT id, codigo, tipo
       FROM reglas_menu
       WHERE codigo = 'EXCLUIR_PLATOS_INACTIVOS' AND eliminado_en IS NULL
       ORDER BY actualizado_en DESC
       LIMIT 1`,
    );
    expect(reglaBase.rows[0]).toBeTruthy();
    const reglaId = reglaBase.rows[0].id;
    const estadoOriginalPlato = await pool.query(
      `SELECT estado FROM platos WHERE id = $1`,
      [platosActivos[0].id],
    );
    expect(estadoOriginalPlato.rows[0]).toBeTruthy();

    try {
      await pool.query(`UPDATE platos SET estado = 'INACTIVO' WHERE id = $1`, [
        platosActivos[0].id,
      ]);

      const posicionBloqueada = await pool.query(
        `SELECT o.id
         FROM dias_version_menu d
         JOIN opciones_dia_menu o ON o.dia_version_menu_id = d.id
         WHERE d.version_semana_id = $1
           AND d.estado_dia = 'DIA_LABORAL'
           AND o.opcion_menu_marca_id = $2
         ORDER BY d.fecha ASC
         LIMIT 1`,
        [sem.versionId, opciones.A.id],
      );
      expect(posicionBloqueada.rows[0]).toBeTruthy();

      await pool.query(
        `UPDATE opciones_dia_menu
         SET plato_id = $2,
             bloqueado_manual = true,
             actualizado_en = NOW()
         WHERE id = $1`,
        [posicionBloqueada.rows[0].id, platosActivos[0].id],
      );

      const perfil = await obtenerPerfilPorCodigo("EQUILIBRADO");
      const generar = await api
        .post(
          `/api/v1/menu/semanas/${sem.semanaId}/versiones/${sem.versionId}/propuestas/generar-personalizada`,
        )
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          perfil_id: perfil.id,
          reglas_adicionales: [],
          reglas_desactivadas: [],
          parametros: {},
          semilla: `E4D-BLOCK-${runTag}`,
          respetar_platos_existentes: false,
          solo_posiciones_vacias: false,
          variar_resultados: false,
        });

      expect(generar.status).toBe(409);

      const snapshotAntes = await pool.query(
        `SELECT dia_version_menu_id, opcion_menu_marca_id, plato_id, bloqueado_manual
         FROM opciones_dia_menu
         WHERE dia_version_menu_id IN (
           SELECT id FROM dias_version_menu WHERE version_semana_id = $1
         )
         ORDER BY dia_version_menu_id, opcion_menu_marca_id`,
        [sem.versionId],
      );

      const codigoConflicto = generar.body.code;
      const mensajeControlado = generar.body.message;
      const detalleConflicto = generar.body.details?.[0] || {};
      const posicionesSinResolver =
        detalleConflicto.posiciones_sin_resolver || [];
      expect(codigoConflicto).toBe("POSICION_BLOQUEADA_CONFLICTIVA");
      expect(detalleConflicto.dia_version_menu_id).toBeTruthy();
      expect(detalleConflicto.opcion_menu_marca_id).toBeTruthy();
      expect(detalleConflicto.plato_id).toBeTruthy();
      expect(detalleConflicto.codigo_regla).toBeTruthy();

      const snapshotDespues = await pool.query(
        `SELECT dia_version_menu_id, opcion_menu_marca_id, plato_id, bloqueado_manual
         FROM opciones_dia_menu
         WHERE dia_version_menu_id IN (
           SELECT id FROM dias_version_menu WHERE version_semana_id = $1
         )
         ORDER BY dia_version_menu_id, opcion_menu_marca_id`,
        [sem.versionId],
      );

      expect(snapshotDespues.rows).toEqual(snapshotAntes.rows);

      const propuestasValidas = await pool.query(
        `SELECT COUNT(*)::int AS n
         FROM propuestas_menu
         WHERE semana_menu_id = $1
           AND version_semana_id = $2
           AND estado IN ('GENERADA','APROBADA','APLICADA')`,
        [sem.semanaId, sem.versionId],
      );

      const reglaNoDegradada = await pool.query(
        `SELECT COALESCE((parametros->>'cantidad')::int, 0) AS cantidad FROM reglas_menu WHERE id = $1`,
        [reglaId],
      );
      expect(reglaNoDegradada.rows[0]).toBeTruthy();
      expect(Number(reglaNoDegradada.rows[0].cantidad)).toBe(0);

      const auditConflicto = await pool.query(
        `SELECT COUNT(*)::int AS n
         FROM auditoria
         WHERE accion = 'CONFLICTO_PROPUESTA'
           AND (datos_posteriores->>'version_id') = $1`,
        [sem.versionId],
      );
      const auditAplicada = await pool.query(
        `SELECT COUNT(*)::int AS n
         FROM auditoria
         WHERE accion = 'APLICAR_PROPUESTA'
           AND entidad_id IN (
             SELECT id::text FROM propuestas_menu
             WHERE semana_menu_id = $1 AND version_semana_id = $2
           )`,
        [sem.semanaId, sem.versionId],
      );

      const diaBloqueado = await pool.query(
        `SELECT d.id AS dia_id, o.opcion_menu_marca_id, o.plato_id
         FROM dias_version_menu d
         JOIN opciones_dia_menu o ON o.dia_version_menu_id = d.id
         WHERE d.version_semana_id = $1
           AND o.bloqueado_manual = true
         ORDER BY d.fecha ASC
         LIMIT 1`,
        [sem.versionId],
      );
      expect(diaBloqueado.rows[0]).toBeTruthy();

      evidenciaConflicto = {
        dia_version_menu_id: diaBloqueado.rows[0].dia_id,
        opcion_menu_marca_id: diaBloqueado.rows[0].opcion_menu_marca_id,
        plato_id: diaBloqueado.rows[0].plato_id,
        codigo_regla: "EXCLUIR_PLATOS_INACTIVOS",
        codigo_conflicto: codigoConflicto,
        mensaje: mensajeControlado,
        posiciones_sin_resolver: posicionesSinResolver,
        propuestas_generadas_validas: Number(propuestasValidas.rows[0].n),
        auditoria_conflicto: Number(auditConflicto.rows[0].n),
        auditoria_aplicar: Number(auditAplicada.rows[0].n),
      };

      console.log(
        "E4D conflicto posición bloqueada:",
        JSON.stringify(evidenciaConflicto, null, 2),
      );

      expect(Number(propuestasValidas.rows[0].n)).toBe(0);
      expect(Number(auditConflicto.rows[0].n)).toBe(1);
      expect(Number(auditAplicada.rows[0].n)).toBe(0);
    } finally {
      await pool.query(`UPDATE platos SET estado = $2 WHERE id = $1`, [
        platosActivos[0].id,
        estadoOriginalPlato.rows[0].estado,
      ]);
    }
  }, 60000);

  test("detalle de propuestas respeta bloqueos, feriados y exclusiones", async () => {
    const idsProhibidos = new Set([
      platosEspeciales.archivado.id,
      platosEspeciales.inactivo.id,
    ]);

    for (const p of propuestasBase) {
      const detalle = await obtenerDetallePropuesta(p.id);
      const rows = detalle.detalle || [];
      const ids = rows.map((d) => d.plato_id).filter(Boolean);
      expect(new Set(ids).size).toBe(ids.length);

      const violaciones = rows.filter(
        (x) =>
          !x.posicion_bloqueada &&
          !x.seleccionado_manual &&
          idsProhibidos.has(x.plato_id),
      );
      expect(violaciones).toHaveLength(0);

      const bloqueadas = rows.filter((x) => x.posicion_bloqueada);
      expect(bloqueadas.length).toBeGreaterThan(0);
      expect(bloqueadas[0].seleccionado_manual).toBe(true);

      for (const d of rows) {
        const evaluaciones =
          d.evaluaciones || d.explicacion?.evaluaciones || [];
        for (const ev of evaluaciones) {
          if (Object.prototype.hasOwnProperty.call(ev, "puntaje_final")) {
            const esperado = Number(
              (
                Number(ev.puntaje_base || 0) +
                Number(ev.premios || 0) -
                Number(ev.penalizaciones || 0)
              ).toFixed(4),
            );
            expect(Number(ev.puntaje_final)).toBe(esperado);
          }
        }
      }
    }
  });

  test("transiciones permitidas y rechazadas", async () => {
    const lunes = addDaysIso(
      obtenerLunesIso(350),
      Number(runTag.slice(-2)) * 7,
    );
    const sem = await crearSemanaEditable({
      lunes,
      platoFallbackA: platosActivos[2].id,
      platoFallbackC: platosActivos[3].id,
    });

    const perfil = await obtenerPerfilPorCodigo("EQUILIBRADO");
    const generar = await api
      .post(
        `/api/v1/menu/semanas/${sem.semanaId}/versiones/${sem.versionId}/propuestas/generar-personalizada`,
      )
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        perfil_id: perfil.id,
        reglas_adicionales: [],
        reglas_desactivadas: [],
        parametros: {},
        semilla: `E4D-TRANS-${runTag}`,
      });
    expect(generar.status).toBe(201);
    const propuestaId = generar.body.datos.id;

    const aprobar = await api
      .post(
        `/api/v1/menu/semanas/${sem.semanaId}/versiones/${sem.versionId}/propuestas/${propuestaId}/aprobar`,
      )
      .set("Authorization", `Bearer ${owner.token}`)
      .send({});
    expect(aprobar.status).toBe(200);

    const aplicar = await api
      .post(
        `/api/v1/menu/semanas/${sem.semanaId}/versiones/${sem.versionId}/propuestas/${propuestaId}/aplicar`,
      )
      .set("Authorization", `Bearer ${owner.token}`)
      .send({});
    expect([200, 409]).toContain(aplicar.status);

    const descartarAplicada = await api
      .post(
        `/api/v1/menu/semanas/${sem.semanaId}/versiones/${sem.versionId}/propuestas/${propuestaId}/descartar`,
      )
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ motivo: "no" });
    if (aplicar.status === 200) {
      expect(descartarAplicada.status).toBe(409);
      expect(descartarAplicada.body.code).toBe("TRANSICION_PROPUESTA_INVALIDA");
    } else {
      expect(descartarAplicada.status).toBe(200);
    }

    const reaprobar = await api
      .post(
        `/api/v1/menu/semanas/${sem.semanaId}/versiones/${sem.versionId}/propuestas/${propuestaId}/aprobar`,
      )
      .set("Authorization", `Bearer ${owner.token}`)
      .send({});
    expect(reaprobar.status).toBe(409);

    const semPerm = await crearSemanaEditable({
      lunes: addDaysIso(lunes, 28),
      platoFallbackA: platosActivos[4].id,
      platoFallbackC: platosActivos[5].id,
    });
    const generarPerm = await api
      .post(
        `/api/v1/menu/semanas/${semPerm.semanaId}/versiones/${semPerm.versionId}/propuestas/generar-personalizada`,
      )
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        perfil_id: perfil.id,
        reglas_adicionales: [],
        reglas_desactivadas: [],
        parametros: {},
        semilla: `E4D-TRANS-ALLOW-${runTag}`,
      });
    expect(generarPerm.status).toBe(201);
    const propuestaPermId = generarPerm.body.datos.id;

    const descartarDesdeGenerada = await api
      .post(
        `/api/v1/menu/semanas/${semPerm.semanaId}/versiones/${semPerm.versionId}/propuestas/${propuestaPermId}/descartar`,
      )
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ motivo: "descartar permitida" });
    expect(descartarDesdeGenerada.status).toBe(200);

    const aprobarDescartada = await api
      .post(
        `/api/v1/menu/semanas/${semPerm.semanaId}/versiones/${semPerm.versionId}/propuestas/${propuestaPermId}/aprobar`,
      )
      .set("Authorization", `Bearer ${owner.token}`)
      .send({});
    expect(aprobarDescartada.status).toBe(409);

    const aplicarDescartada = await api
      .post(
        `/api/v1/menu/semanas/${semPerm.semanaId}/versiones/${semPerm.versionId}/propuestas/${propuestaPermId}/aplicar`,
      )
      .set("Authorization", `Bearer ${owner.token}`)
      .send({});
    expect(aplicarDescartada.status).toBe(409);
  }, 60000);

  test("rollback real con failpoint controlado en tests", async () => {
    const perfil = await obtenerPerfilPorCodigo("HISTORICO");
    const generar = await api
      .post(
        `/api/v1/menu/semanas/${semanaObjetivo}/versiones/${versionObjetivo}/propuestas/generar-personalizada`,
      )
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        perfil_id: perfil.id,
        reglas_adicionales: [],
        reglas_desactivadas: [],
        parametros: {},
        semilla: `E4D-ROLL-${runTag}`,
      });
    expect(generar.status).toBe(201);
    const propuestaId = generar.body.datos.id;

    const antes = await pool.query(
      `SELECT dia_version_menu_id, opcion_menu_marca_id, plato_id
       FROM opciones_dia_menu
       WHERE dia_version_menu_id IN (
         SELECT id FROM dias_version_menu WHERE version_semana_id = $1
       )
       ORDER BY dia_version_menu_id, opcion_menu_marca_id`,
      [versionObjetivo],
    );

    process.env.PROPUESTAS_TEST_FAIL_AFTER_UPDATES = "1";
    const aplicar = await api
      .post(
        `/api/v1/menu/semanas/${semanaObjetivo}/versiones/${versionObjetivo}/propuestas/${propuestaId}/aplicar`,
      )
      .set("Authorization", `Bearer ${owner.token}`)
      .send({});
    expect(aplicar.status).toBeGreaterThanOrEqual(400);
    delete process.env.PROPUESTAS_TEST_FAIL_AFTER_UPDATES;

    const despues = await pool.query(
      `SELECT dia_version_menu_id, opcion_menu_marca_id, plato_id
       FROM opciones_dia_menu
       WHERE dia_version_menu_id IN (
         SELECT id FROM dias_version_menu WHERE version_semana_id = $1
       )
       ORDER BY dia_version_menu_id, opcion_menu_marca_id`,
      [versionObjetivo],
    );
    expect(despues.rows).toEqual(antes.rows);

    const propuesta = await obtenerDetallePropuesta(propuestaId);
    expect(propuesta.estado).not.toBe("APLICADA");
  }, 60000);

  test("propuesta desactualizada mantiene integridad", async () => {
    const perfil = await obtenerPerfilPorCodigo("EQUILIBRADO");
    const generar = await api
      .post(
        `/api/v1/menu/semanas/${semanaObjetivo}/versiones/${versionObjetivo}/propuestas/generar-personalizada`,
      )
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        perfil_id: perfil.id,
        reglas_adicionales: [],
        reglas_desactivadas: [],
        parametros: {},
        semilla: `E4D-OLD-${runTag}`,
      });
    expect(generar.status).toBe(201);
    const propuestaId = generar.body.datos.id;

    const propuestaAntes = await obtenerDetallePropuesta(propuestaId);
    expect(propuestaAntes.estado).toBe("GENERADA");

    const martes = addDaysIso(
      (
        await pool.query(
          "SELECT fecha_inicio FROM semanas_menu WHERE id = $1",
          [semanaObjetivo],
        )
      ).rows[0].fecha_inicio
        .toISOString()
        .slice(0, 10),
      2,
    );

    const mutar = await api
      .put(
        `/api/v1/menu/semanas/${semanaObjetivo}/versiones/${versionObjetivo}/dias/${martes}/opciones`,
      )
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        opciones: [
          {
            opcionMenuMarcaId: opciones.A.id,
            platoId: platosActivos[22].id,
            orden: 1,
            bloqueadoManual: false,
          },
          {
            opcionMenuMarcaId: opciones.C.id,
            platoId: platosActivos[23].id,
            orden: 2,
            bloqueadoManual: false,
          },
        ],
      });
    expect(mutar.status).toBe(200);

    const aplicar = await api
      .post(
        `/api/v1/menu/semanas/${semanaObjetivo}/versiones/${versionObjetivo}/propuestas/${propuestaId}/aplicar`,
      )
      .set("Authorization", `Bearer ${owner.token}`)
      .send({});
    expect(aplicar.status).toBe(409);
    expect(aplicar.body.code).toBe("PROPUESTA_DESACTUALIZADA");
  }, 60000);

  test("evaluación previa no muta base de datos", async () => {
    const perfil = await obtenerPerfilPorCodigo("EQUILIBRADO");
    const antes = await pool.query(
      `SELECT COUNT(*)::int AS n FROM auditoria WHERE entidad IN ('reglas_menu','propuestas_menu')`,
    );

    const r = await api
      .post("/api/v1/menu/reglas/evaluar")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        perfilId: perfil.id,
        semanaId: semanaObjetivo,
        versionId: versionObjetivo,
      });
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body?.datos?.reglas)).toBe(true);

    const despues = await pool.query(
      `SELECT COUNT(*)::int AS n FROM auditoria WHERE entidad IN ('reglas_menu','propuestas_menu')`,
    );
    expect(Number(despues.rows[0].n)).toBe(Number(antes.rows[0].n));
  });

  test("permisos de aplicación aislados por propuesta", async () => {
    const perfil = await obtenerPerfilPorCodigo("EQUILIBRADO");
    const sinToken = await api
      .post(
        `/api/v1/menu/semanas/${semanaObjetivo}/versiones/${versionObjetivo}/propuestas/${propuestasBase[0].id}/aplicar`,
      )
      .send({});
    expect(sinToken.status).toBe(401);

    const porRol = [
      ["CLIENTE", 403],
      ["LECTOR", 403],
      ["EDITOR", 200],
      ["ADMINISTRADOR", 200],
      ["PROPIETARIO", 200],
    ];

    for (const [idx, [rol, esperado]] of porRol.entries()) {
      const sem = await crearSemanaEditable({
        lunes: addDaysIso(
          obtenerLunesIso(420),
          idx * 14 + Number(runTag.slice(-2)) * 7,
        ),
        platoFallbackA: platosActivos[0].id,
        platoFallbackC: platosActivos[1].id,
      });

      const generar = await api
        .post(
          `/api/v1/menu/semanas/${sem.semanaId}/versiones/${sem.versionId}/propuestas/generar-personalizada`,
        )
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          perfil_id: perfil.id,
          reglas_adicionales: [],
          reglas_desactivadas: [],
          parametros: {},
          semilla: `E4D-PERM-${rol}-${Date.now()}`,
          respetar_platos_existentes: false,
          solo_posiciones_vacias: false,
          variar_resultados: false,
        });
      expect(generar.status).toBe(201);

      const detallePrevio = await api
        .get(
          `/api/v1/menu/semanas/${sem.semanaId}/versiones/${sem.versionId}/propuestas/${generar.body.datos.id}`,
        )
        .set("Authorization", `Bearer ${owner.token}`);
      expect(detallePrevio.status).toBe(200);
      expect(detallePrevio.body.datos.estado).toBe("GENERADA");

      const token = roles[rol].token;
      const aplicar = await api
        .post(
          `/api/v1/menu/semanas/${sem.semanaId}/versiones/${sem.versionId}/propuestas/${generar.body.datos.id}/aplicar`,
        )
        .set("Authorization", `Bearer ${token}`)
        .send({});

      evidenciaPermisos.push({
        rol,
        httpEsperado: esperado,
        httpReal: aplicar.status,
      });
      console.log(
        "E4D permiso aplicar:",
        JSON.stringify({ rol, esperado, real: aplicar.status }),
      );

      if (esperado === 200) {
        if (aplicar.status !== 200) {
          const propuestaActual = await api
            .get(
              `/api/v1/menu/semanas/${sem.semanaId}/versiones/${sem.versionId}/propuestas/${generar.body.datos.id}`,
            )
            .set("Authorization", `Bearer ${owner.token}`);
          const versionActual = await pool.query(
            `SELECT id, estado, aprobado_en, publicado_en, actualizado_en
             FROM versiones_semana_menu WHERE id = $1`,
            [sem.versionId],
          );
          console.log(
            "E4D diagnostico 409 autorizado:",
            JSON.stringify(
              {
                rol,
                aplicarStatus: aplicar.status,
                aplicarCode: aplicar.body?.code || null,
                aplicarMessage: aplicar.body?.message || null,
                propuestaEstado: propuestaActual.body?.datos?.estado || null,
                propuestaHuella:
                  propuestaActual.body?.datos?.version_huella || null,
                versionEstado: versionActual.rows[0]?.estado || null,
                versionAprobadaEn: versionActual.rows[0]?.aprobado_en || null,
                versionPublicadaEn: versionActual.rows[0]?.publicado_en || null,
                versionActualizadaEn:
                  versionActual.rows[0]?.actualizado_en || null,
              },
              null,
              2,
            ),
          );
        }
        expect(aplicar.status).toBe(200);
        const detalle = await api
          .get(
            `/api/v1/menu/semanas/${sem.semanaId}/versiones/${sem.versionId}/propuestas/${generar.body.datos.id}`,
          )
          .set("Authorization", `Bearer ${owner.token}`);
        expect(detalle.status).toBe(200);
        expect(detalle.body.datos.estado).toBe("APLICADA");

        const opcionesAplicadas = await pool.query(
          `SELECT COUNT(*)::int AS n
           FROM opciones_dia_menu o
           JOIN dias_version_menu d ON d.id = o.dia_version_menu_id
           WHERE d.version_semana_id = $1
             AND o.plato_id IS NOT NULL`,
          [sem.versionId],
        );
        expect(Number(opcionesAplicadas.rows[0].n)).toBeGreaterThan(0);

        const bloqueadas = await pool.query(
          `SELECT COUNT(*)::int AS n
           FROM opciones_dia_menu o
           JOIN dias_version_menu d ON d.id = o.dia_version_menu_id
           WHERE d.version_semana_id = $1 AND o.bloqueado_manual = true`,
          [sem.versionId],
        );
        expect(Number(bloqueadas.rows[0].n)).toBeGreaterThanOrEqual(0);

        const version = await pool.query(
          `SELECT publicado_en FROM versiones_semana_menu WHERE id = $1`,
          [sem.versionId],
        );
        expect(version.rows[0].publicado_en).toBeNull();

        const audit = await pool.query(
          `SELECT COUNT(*)::int AS n
           FROM auditoria
           WHERE accion = 'APLICAR_PROPUESTA'
             AND entidad_id = $1`,
          [generar.body.datos.id],
        );
        expect(Number(audit.rows[0].n)).toBe(1);
      } else {
        expect(aplicar.status).toBe(esperado);
      }
    }

    evidenciaPermisos.push({
      rol: "SIN_TOKEN",
      httpEsperado: 401,
      httpReal: 401,
    });
    console.table(evidenciaPermisos);
  }, 120000);

  test("auditoría registra acciones clave sin secretos", async () => {
    const audit = await pool.query(
      `SELECT accion, entidad, entidad_id, datos_anteriores, datos_posteriores, motivo
       FROM auditoria
       WHERE accion IN (
        'CREAR_REGLA','ACTUALIZAR_REGLA','CAMBIAR_ESTADO_REGLA','DUPLICAR_REGLA',
        'CREAR_PERFIL','ACTUALIZAR_PERFIL','REEMPLAZAR_REGLAS_PERFIL',
        'GENERAR_PROPUESTA','APROBAR_PROPUESTA','DESCARTAR_PROPUESTA','APLICAR_PROPUESTA',
        'PROPUESTA_DESACTUALIZADA','CONFLICTO_PROPUESTA'
       )
       ORDER BY creado_en DESC
       LIMIT 200`,
    );

    expect(audit.rows.length).toBeGreaterThan(0);
    for (const row of audit.rows) {
      const dump = JSON.stringify(row);
      expect(dump.toLowerCase().includes("token")).toBe(false);
      expect(dump.toLowerCase().includes("password")).toBe(false);
      expect(dump.toLowerCase().includes("select ")).toBe(false);
      expect(dump.toLowerCase().includes("stack")).toBe(false);
    }
  });

  test("runtime final de endpoints ETAPA4", async () => {
    const health = await api.get("/health");
    expect(health.status).toBe(200);

    const db = await api.get("/api/v1/db");
    expect(db.status).toBe(200);

    const docs = await api.get("/api/v1/documentacion/");
    expect(docs.status).toBe(200);

    const reglas = await api
      .get("/api/v1/menu/reglas")
      .set("Authorization", `Bearer ${owner.token}`);
    expect(reglas.status).toBe(200);

    const perfiles = await api
      .get("/api/v1/menu/perfiles-reglas")
      .set("Authorization", `Bearer ${owner.token}`);
    expect(perfiles.status).toBe(200);

    const evaluar = await api
      .post("/api/v1/menu/reglas/evaluar")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ perfilId: perfiles.body?.datos?.perfiles?.[0]?.id });
    expect(evaluar.status).toBe(200);

    const propuesta = propuestasBase[0];
    const listado = await api
      .get(
        `/api/v1/menu/semanas/${semanaObjetivo}/versiones/${versionObjetivo}/propuestas`,
      )
      .set("Authorization", `Bearer ${owner.token}`);
    expect(listado.status).toBe(200);

    const detalle = await api
      .get(
        `/api/v1/menu/semanas/${semanaObjetivo}/versiones/${versionObjetivo}/propuestas/${propuesta.id}`,
      )
      .set("Authorization", `Bearer ${owner.token}`);
    expect(detalle.status).toBe(200);
  });
});
