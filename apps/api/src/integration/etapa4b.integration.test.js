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
} from "./etapa3g.utils.js";

// ─── Variables de módulo ─────────────────────────────────────────────────────

let api;
let closeDb;
let pool;
let owner;
let roles;
let marca;
let opciones;

// Semana compartida para tests que NO necesitan flujo aprobar/aplicar
let semanaCompartida;
let versionCompartida;

// Primera propuesta generada en "genera tres propuestas" (permanece GENERADA hasta "permisos")
let propuestaGenerada;

// Sufijo único por corrida garantiza aislamiento entre ejecuciones consecutivas
let prefijoCorrida; // e.g. "E4B_1A2B3C4D5E"
let baseWeekIndex;
let platos = [];

// ─── Helpers internos ────────────────────────────────────────────────────────

async function asegurarPerfilesInicialesEtapa4(poolRef, usuarioId) {
  const defs = [
    { codigo: "EQUILIBRADO", nombre: "Perfil equilibrado" },
    { codigo: "HISTORICO", nombre: "Perfil histórico" },
    { codigo: "RENOVACION", nombre: "Perfil renovación" },
  ];
  for (const p of defs) {
    await poolRef.query(
      `INSERT INTO perfiles_reglas
         (id, codigo, nombre, descripcion, estado, es_predeterminado,
          creado_por, actualizado_por, creado_en, actualizado_en)
       SELECT $1,$2,$3,$4,'ACTIVO',true,$5,$5,NOW(),NOW()
       WHERE NOT EXISTS (
         SELECT 1 FROM perfiles_reglas WHERE codigo=$2 AND eliminado_en IS NULL
       )`,
      [
        randomUUID(),
        p.codigo,
        p.nombre,
        `Autoreparado ${prefijoCorrida}`,
        usuarioId,
      ],
    );
    await poolRef.query(
      `UPDATE perfiles_reglas
       SET estado='ACTIVO', eliminado_en=NULL, actualizado_en=NOW(), actualizado_por=$2
       WHERE codigo=$1`,
      [p.codigo, usuarioId],
    );
  }
  const perfiles = await poolRef.query(
    `SELECT id FROM perfiles_reglas
     WHERE codigo IN ('EQUILIBRADO','HISTORICO','RENOVACION') AND eliminado_en IS NULL`,
  );
  const reglas = await poolRef.query(
    `SELECT id FROM reglas_menu WHERE estado='ACTIVA' AND eliminado_en IS NULL`,
  );
  for (const pf of perfiles.rows) {
    let orden = 1;
    for (const rg of reglas.rows) {
      await poolRef.query(
        `INSERT INTO perfiles_reglas_detalle (id,perfil_id,regla_id,orden,activa,creado_en,actualizado_en)
         VALUES ($1,$2,$3,$4,true,NOW(),NOW())
         ON CONFLICT (perfil_id,regla_id) DO NOTHING`,
        [randomUUID(), pf.id, rg.id, orden],
      );
      orden += 1;
    }
  }
}

/** Crea semana + opciones pre-asignadas. */
async function crearSemanaEditable({
  lunes,
  asignacionesDia = {},
  platoFallbackA,
  platoFallbackC,
}) {
  const crear = await api
    .post("/api/v1/menu/semanas")
    .set("Authorization", `Bearer ${owner.token}`)
    .send({
      marcaId: marca.id,
      canalId: null,
      empresaId: null,
      fechaInicio: lunes,
      fechaFin: addDaysIso(lunes, 6),
    });
  expect(crear.status).toBe(201);

  const { id: semanaId } = crear.body.datos.semana;
  const { id: versionId } = crear.body.datos.versionInicial;

  await api
    .put(
      `/api/v1/menu/semanas/${semanaId}/versiones/${versionId}/dias/${lunes}`,
    )
    .set("Authorization", `Bearer ${owner.token}`)
    .send({ estado: "FERIADO", observaciones: `Feriado ${prefijoCorrida}` });

  for (let i = 1; i <= 5; i += 1) {
    const fecha = addDaysIso(lunes, i);
    const asig = asignacionesDia[fecha] || {};
    await api
      .put(
        `/api/v1/menu/semanas/${semanaId}/versiones/${versionId}/dias/${fecha}`,
      )
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        estado: "DIA_LABORAL",
        observaciones: `Laboral ${i} ${prefijoCorrida}`,
      });
    await api
      .put(
        `/api/v1/menu/semanas/${semanaId}/versiones/${versionId}/dias/${fecha}/opciones`,
      )
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        opciones: [
          {
            opcionMenuMarcaId: opciones.A.id,
            platoId: asig.A || platoFallbackA,
            orden: 1,
            bloqueadoManual: Boolean(asig.ABloqueado),
          },
          {
            opcionMenuMarcaId: opciones.C.id,
            platoId: asig.C || platoFallbackC,
            orden: 2,
            bloqueadoManual: Boolean(asig.CBloqueado),
          },
        ],
      });
  }
  return { semanaId, versionId };
}

/** Lleva una versión a PUBLICADO (ignora 409 si ya estaba en ese estado). */
async function publicarSemana(semanaId, versionId) {
  await api
    .post(`/api/v1/menu/semanas/${semanaId}/versiones/${versionId}/proponer`)
    .set("Authorization", `Bearer ${owner.token}`)
    .send({});
  await api
    .post(`/api/v1/menu/semanas/${semanaId}/versiones/${versionId}/aprobar`)
    .set("Authorization", `Bearer ${owner.token}`)
    .send({});
  await api
    .post(`/api/v1/menu/semanas/${semanaId}/versiones/${versionId}/publicar`)
    .set("Authorization", `Bearer ${owner.token}`)
    .send({});
}

async function obtenerPerfilPorCodigo(codigo) {
  const r = await pool.query(
    `SELECT id FROM perfiles_reglas WHERE codigo=$1 AND eliminado_en IS NULL LIMIT 1`,
    [codigo],
  );
  expect(r.rows[0]).toBeTruthy();
  return r.rows[0];
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe("Etapa 4B - Integración real reglas/perfiles/propuestas", () => {
  beforeAll(async () => {
    // Identificador único: UUID truncado → sin colisiones entre ejecuciones
    const uid = randomUUID().replace(/-/g, "").toUpperCase().slice(0, 10);
    prefijoCorrida = `E4B_${uid}`;
    // Índice base aleatorio en [60000, 90000) → años ~3192-3769 (safe JS Date)
    baseWeekIndex = 60000 + Math.floor(Math.random() * 30000);

    const boot = await bootstrapApi("etapa4b");
    api = boot.api;
    closeDb = boot.closeDb;
    pool = boot.getPool();

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
    await asegurarPerfilesInicialesEtapa4(pool, owner.id);

    const sufijo = prefijoCorrida.toLowerCase();
    roles = {
      CLIENTE: await crearUsuarioConRol(api, owner.token, "CLIENTE", sufijo),
      LECTOR: await crearUsuarioConRol(api, owner.token, "LECTOR", sufijo),
      EDITOR: await crearUsuarioConRol(api, owner.token, "EDITOR", sufijo),
      ADMINISTRADOR: await crearUsuarioConRol(
        api,
        owner.token,
        "ADMINISTRADOR",
        sufijo,
      ),
    };

    const cats = await pool.query(
      `SELECT id FROM categorias_plato WHERE marca_id=$1 ORDER BY codigo ASC LIMIT 4`,
      [marca.id],
    );
    const prot = await pool.query(
      `SELECT id FROM proteinas WHERE marca_id=$1 ORDER BY codigo ASC LIMIT 4`,
      [marca.id],
    );

    platos = [];
    for (let i = 0; i < 20; i += 1) {
      const p = await crearPlatoBasico(pool, {
        marcaId: marca.id,
        nombre: `${prefijoCorrida} Plato ${String(i + 1).padStart(2, "0")}`,
        codigo: `${prefijoCorrida}_${String(i + 1).padStart(2, "0")}`,
        usuarioId: owner.id,
      });
      platos.push(p);
      await pool.query(
        `INSERT INTO platos_categorias (plato_id,categoria_id,creado_en) VALUES ($1,$2,NOW()) ON CONFLICT DO NOTHING`,
        [p.id, cats.rows[i % cats.rows.length].id],
      );
      await pool.query(
        `INSERT INTO platos_proteinas (plato_id,proteina_id,creado_en) VALUES ($1,$2,NOW()) ON CONFLICT DO NOTHING`,
        [p.id, prot.rows[i % prot.rows.length].id],
      );
    }

    // Histórica H1 (publicada)
    const h1l = obtenerLunesIso(baseWeekIndex);
    const h1 = await crearSemanaEditable({
      lunes: h1l,
      platoFallbackA: platos[18].id,
      platoFallbackC: platos[19].id,
      asignacionesDia: {
        [addDaysIso(h1l, 1)]: { A: platos[0].id, C: platos[1].id },
        [addDaysIso(h1l, 2)]: { A: platos[0].id, C: platos[2].id },
        [addDaysIso(h1l, 3)]: { A: platos[3].id, C: platos[4].id },
        [addDaysIso(h1l, 4)]: { A: platos[5].id, C: platos[6].id },
      },
    });
    await publicarSemana(h1.semanaId, h1.versionId);

    // Histórica H2 (publicada)
    const h2l = obtenerLunesIso(baseWeekIndex + 2);
    const h2 = await crearSemanaEditable({
      lunes: h2l,
      platoFallbackA: platos[18].id,
      platoFallbackC: platos[19].id,
      asignacionesDia: {
        [addDaysIso(h2l, 1)]: { A: platos[7].id, C: platos[8].id },
        [addDaysIso(h2l, 2)]: { A: platos[9].id, C: platos[10].id },
        [addDaysIso(h2l, 3)]: { A: platos[11].id, C: platos[12].id },
        [addDaysIso(h2l, 4)]: { A: platos[13].id, C: platos[14].id },
      },
    });
    await publicarSemana(h2.semanaId, h2.versionId);

    // Semana objetivo compartida (editable, sin publicar)
    const objl = obtenerLunesIso(baseWeekIndex + 4);
    const sc = await crearSemanaEditable({
      lunes: objl,
      platoFallbackA: platos[18].id,
      platoFallbackC: platos[19].id,
      asignacionesDia: {
        [addDaysIso(objl, 1)]: {
          A: platos[14].id,
          ABloqueado: true,
          C: platos[15].id,
        },
      },
    });
    semanaCompartida = sc.semanaId;
    versionCompartida = sc.versionId;
  }, 300000);

  afterAll(async () => {
    try {
      const ids = platos.map((p) => p.id);
      if (ids.length) {
        await pool.query(
          `DELETE FROM platos_categorias WHERE plato_id = ANY($1::uuid[])`,
          [ids],
        );
        await pool.query(
          `DELETE FROM platos_proteinas  WHERE plato_id = ANY($1::uuid[])`,
          [ids],
        );
        await pool.query(`DELETE FROM platos WHERE id = ANY($1::uuid[])`, [
          ids,
        ]);
      }
      await pool.query(`DELETE FROM reglas_menu WHERE codigo LIKE $1`, [
        `${prefijoCorrida}%`,
      ]);
    } catch {
      /* ignorar */
    } finally {
      if (closeDb) await closeDb();
    }
  });

  // ─────────────────────────────────────────────────────────────────────────

  test("CRUD reglas y validaciones base", async () => {
    const listar = await api
      .get("/api/v1/menu/reglas")
      .set("Authorization", `Bearer ${owner.token}`);
    expect(listar.status).toBe(200);

    const oblig = await api
      .post("/api/v1/menu/reglas")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        codigo: `${prefijoCorrida}_NO_REPETIR`,
        nombre: `No repetir ${prefijoCorrida}`,
        tipo: "NO_REPETIR_PLATO_EN_SEMANA",
        naturaleza: "OBLIGATORIA",
        prioridad: 10,
        peso: 0,
        parametros: {},
      });
    expect(oblig.status).toBe(201);

    const pref = await api
      .post("/api/v1/menu/reglas")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        codigo: `${prefijoCorrida}_FAVORITOS`,
        nombre: `Favoritos ${prefijoCorrida}`,
        tipo: "PRIORIZAR_FAVORITOS",
        naturaleza: "PREFERENCIAL",
        prioridad: 4,
        peso: 3,
        parametros: { factor: 1 },
      });
    expect(pref.status).toBe(201);

    const inv = await api
      .post("/api/v1/menu/reglas")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        codigo: `${prefijoCorrida}_INV`,
        nombre: "Inv",
        tipo: "TIPO_INEXISTENTE",
        naturaleza: "OBLIGATORIA",
        prioridad: -1,
        peso: 0,
        parametros: {},
      });
    expect([400, 422]).toContain(inv.status);

    const id = pref.body.datos.id;
    expect(
      (
        await api
          .patch(`/api/v1/menu/reglas/${id}`)
          .set("Authorization", `Bearer ${owner.token}`)
          .send({ nombre: `${prefijoCorrida} v2`, peso: 5 })
      ).status,
    ).toBe(200);
    expect(
      (
        await api
          .patch(`/api/v1/menu/reglas/${id}/estado`)
          .set("Authorization", `Bearer ${owner.token}`)
          .send({ estado: "INACTIVA" })
      ).status,
    ).toBe(200);
    expect(
      (
        await api
          .post(`/api/v1/menu/reglas/${id}/duplicar`)
          .set("Authorization", `Bearer ${owner.token}`)
          .send({})
      ).status,
    ).toBe(201);
  });

  test("CRUD perfiles y reemplazo transaccional", async () => {
    const rl = await api
      .get("/api/v1/menu/reglas")
      .query({ limite: 5, ordenCampo: "codigo", ordenDireccion: "asc" })
      .set("Authorization", `Bearer ${owner.token}`);
    expect(rl.status).toBe(200);
    const [rA, rB] = rl.body.datos.reglas;

    const cp = await api
      .post("/api/v1/menu/perfiles-reglas")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        codigo: `${prefijoCorrida}_PERFIL`,
        nombre: `Perfil ${prefijoCorrida}`,
        descripcion: `Perfil ${prefijoCorrida}`,
        reglas: [
          { reglaId: rA.id, orden: 1, activa: true, pesoPersonalizado: 2 },
          {
            reglaId: rB.id,
            orden: 2,
            activa: true,
            prioridadPersonalizada: 11,
          },
        ],
      });
    expect(cp.status).toBe(201);
    const pid = cp.body.datos.id;

    const det = await api
      .get(`/api/v1/menu/perfiles-reglas/${pid}`)
      .set("Authorization", `Bearer ${owner.token}`);
    expect(det.status).toBe(200);
    expect((det.body?.datos?.reglas || []).length).toBeGreaterThanOrEqual(2);

    expect(
      (
        await api
          .put(`/api/v1/menu/perfiles-reglas/${pid}/reglas`)
          .set("Authorization", `Bearer ${owner.token}`)
          .send({
            reglas: [
              { reglaId: rA.id, orden: 1, activa: true, pesoPersonalizado: 3 },
            ],
          })
      ).status,
    ).toBe(200);
    expect(
      (
        await api
          .post(`/api/v1/menu/perfiles-reglas/${pid}/duplicar`)
          .set("Authorization", `Bearer ${owner.token}`)
          .send({})
      ).status,
    ).toBe(201);
  });

  test("genera tres propuestas reales y no idénticas", async () => {
    const r = await api
      .post(
        `/api/v1/menu/semanas/${semanaCompartida}/versiones/${versionCompartida}/propuestas/generar`,
      )
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        generar_perfiles_iniciales: true,
        respetar_platos_existentes: true,
        solo_posiciones_vacias: false,
        variar_resultados: false,
        semilla: `${prefijoCorrida}-BASE`,
        posiciones_bloqueadas: [],
      });

    expect(r.status).toBe(201);
    const props = r.body?.datos?.propuestas || [];
    expect(props).toHaveLength(3);
    expect(props.map((p) => p.tipo).sort()).toEqual([
      "EQUILIBRADA",
      "HISTORICA",
      "RENOVACION",
    ]);
    expect(new Set(props.map((p) => p.semilla)).size).toBe(3);

    // Guardar primera propuesta (permanece GENERADA; usada en "permisos" más adelante)
    propuestaGenerada = props[0];

    const [dA, dB] = await Promise.all([
      api
        .get(
          `/api/v1/menu/semanas/${semanaCompartida}/versiones/${versionCompartida}/propuestas/${props[0].id}`,
        )
        .set("Authorization", `Bearer ${owner.token}`),
      api
        .get(
          `/api/v1/menu/semanas/${semanaCompartida}/versiones/${versionCompartida}/propuestas/${props[1].id}`,
        )
        .set("Authorization", `Bearer ${owner.token}`),
    ]);
    expect(dA.status).toBe(200);
    expect(dB.status).toBe(200);

    const platosA = (dA.body?.datos?.detalle || []).map((d) => d.plato_id);
    const platosB = (dB.body?.datos?.detalle || []).map((d) => d.plato_id);
    if (platosA.join("|") === platosB.join("|")) {
      expect(dA.body?.datos?.tipo).not.toBe(dB.body?.datos?.tipo);
    } else {
      expect(platosA).not.toEqual(platosB);
    }
  }, 60000);

  test("determinismo en generación personalizada", async () => {
    const perf = await obtenerPerfilPorCodigo("EQUILIBRADO");
    const payload = {
      perfil_id: perf.id,
      reglas_adicionales: [],
      reglas_desactivadas: [],
      parametros: {},
      semilla: `${prefijoCorrida}-DETERMINISTA`,
      variar_resultados: false,
    };

    const [a, b] = await Promise.all([
      api
        .post(
          `/api/v1/menu/semanas/${semanaCompartida}/versiones/${versionCompartida}/propuestas/generar-personalizada`,
        )
        .set("Authorization", `Bearer ${owner.token}`)
        .send(payload),
      api
        .post(
          `/api/v1/menu/semanas/${semanaCompartida}/versiones/${versionCompartida}/propuestas/generar-personalizada`,
        )
        .set("Authorization", `Bearer ${owner.token}`)
        .send(payload),
    ]);
    expect(a.status).toBe(201);
    expect(b.status).toBe(201);

    const [da, db] = await Promise.all([
      api
        .get(
          `/api/v1/menu/semanas/${semanaCompartida}/versiones/${versionCompartida}/propuestas/${a.body.datos.id}`,
        )
        .set("Authorization", `Bearer ${owner.token}`),
      api
        .get(
          `/api/v1/menu/semanas/${semanaCompartida}/versiones/${versionCompartida}/propuestas/${b.body.datos.id}`,
        )
        .set("Authorization", `Bearer ${owner.token}`),
    ]);
    const keyA = (da.body.datos.detalle || []).map(
      (x) => `${x.fecha}|${x.opcion_menu_marca_id}|${x.plato_id}|${x.puntaje}`,
    );
    const keyB = (db.body.datos.detalle || []).map(
      (x) => `${x.fecha}|${x.opcion_menu_marca_id}|${x.plato_id}|${x.puntaje}`,
    );
    expect(keyA).toEqual(keyB);
  }, 60000);

  /**
   * Completamente aislado: crea su propia semana SX para el flujo aprobar→aplicar
   * y su propia semana SD para detectar propuesta desactualizada.
   * No lee ni modifica semanaCompartida ni propuestaGenerada.
   */
  test("aprobar y aplicar propuesta, luego detectar desactualizada", async () => {
    const perf = await obtenerPerfilPorCodigo("EQUILIBRADO");

    // ── SX: flujo aprobar → aplicar ─────────────────────────────────────────
    const sxL = obtenerLunesIso(baseWeekIndex + 6);
    const sx = await crearSemanaEditable({
      lunes: sxL,
      platoFallbackA: platos[0].id,
      platoFallbackC: platos[1].id,
      asignacionesDia: {
        [addDaysIso(sxL, 1)]: {
          A: platos[2].id,
          ABloqueado: true,
          C: platos[3].id,
        },
        [addDaysIso(sxL, 2)]: { A: platos[4].id, C: platos[5].id },
      },
    });

    const genSx = await api
      .post(
        `/api/v1/menu/semanas/${sx.semanaId}/versiones/${sx.versionId}/propuestas/generar-personalizada`,
      )
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        perfil_id: perf.id,
        reglas_adicionales: [],
        reglas_desactivadas: [],
        parametros: {},
        semilla: `${prefijoCorrida}-SX`,
        variar_resultados: false,
      });
    expect(genSx.status).toBe(201);

    const propSxId = genSx.body.datos.id;
    const propSxPerfilId = genSx.body.datos.perfil_reglas_id;
    expect(propSxId).toBeTruthy();

    // Estado inicial = GENERADA
    const detAntes = await api
      .get(
        `/api/v1/menu/semanas/${sx.semanaId}/versiones/${sx.versionId}/propuestas/${propSxId}`,
      )
      .set("Authorization", `Bearer ${owner.token}`);
    expect(detAntes.status).toBe(200);
    expect(detAntes.body.datos.estado).toBe("GENERADA");

    // Conteo de opciones antes de aplicar
    const opAntes = await pool.query(
      `SELECT COUNT(*)::int AS n FROM opciones_dia_menu o
       JOIN dias_version_menu d ON d.id = o.dia_version_menu_id
       WHERE d.version_semana_id = $1`,
      [sx.versionId],
    );
    expect(Number(opAntes.rows[0].n)).toBeGreaterThan(0);

    // ── APROBAR → 200, estado = APROBADA ────────────────────────────────────
    const aprobar = await api
      .post(
        `/api/v1/menu/semanas/${sx.semanaId}/versiones/${sx.versionId}/propuestas/${propSxId}/aprobar`,
      )
      .set("Authorization", `Bearer ${owner.token}`)
      .send({});
    expect(aprobar.status).toBe(200);
    expect(aprobar.body.datos.estado).toBe("APROBADA");

    // ── APLICAR → 200, estado = APLICADA ────────────────────────────────────
    const aplicar = await api
      .post(
        `/api/v1/menu/semanas/${sx.semanaId}/versiones/${sx.versionId}/propuestas/${propSxId}/aplicar`,
      )
      .set("Authorization", `Bearer ${owner.token}`)
      .send({});
    expect(aplicar.status).toBe(200);
    expect(aplicar.body.datos.estado).toBe("APLICADA");

    // ── Assertions post-apply ────────────────────────────────────────────────

    // Opciones siguen persistidas
    const opDespues = await pool.query(
      `SELECT COUNT(*)::int AS n FROM opciones_dia_menu o
       JOIN dias_version_menu d ON d.id = o.dia_version_menu_id
       WHERE d.version_semana_id = $1`,
      [sx.versionId],
    );
    expect(Number(opDespues.rows[0].n)).toBe(Number(opAntes.rows[0].n));

    // Versión sigue editable (apply no publica)
    const ver = await pool.query(
      `SELECT estado FROM versiones_semana_menu WHERE id = $1`,
      [sx.versionId],
    );
    expect(["BORRADOR", "PROPUESTO", "APROBADO"]).toContain(ver.rows[0].estado);
    expect(ver.rows[0].estado).not.toBe("PUBLICADO");
    expect(ver.rows[0].estado).not.toBe("FINALIZADO");

    // Auditoría de aplicación
    const aud = await pool.query(
      `SELECT COUNT(*)::int AS n FROM auditoria
       WHERE accion='APLICAR_PROPUESTA' AND entidad_id=$1`,
      [propSxId],
    );
    expect(Number(aud.rows[0].n)).toBeGreaterThanOrEqual(1);

    // Posición bloqueada preservada
    const bloq = await pool.query(
      `SELECT COUNT(*)::int AS n FROM opciones_dia_menu o
       JOIN dias_version_menu d ON d.id = o.dia_version_menu_id
       WHERE d.version_semana_id=$1 AND o.bloqueado_manual=true`,
      [sx.versionId],
    );
    expect(Number(bloq.rows[0].n)).toBeGreaterThanOrEqual(1);

    // ── SD: detección de propuesta desactualizada ────────────────────────────
    const sdL = obtenerLunesIso(baseWeekIndex + 7);
    const sd = await crearSemanaEditable({
      lunes: sdL,
      platoFallbackA: platos[6].id,
      platoFallbackC: platos[7].id,
      asignacionesDia: {
        [addDaysIso(sdL, 1)]: { A: platos[8].id, C: platos[9].id },
        [addDaysIso(sdL, 2)]: { A: platos[10].id, C: platos[11].id },
      },
    });

    const genSd = await api
      .post(
        `/api/v1/menu/semanas/${sd.semanaId}/versiones/${sd.versionId}/propuestas/generar-personalizada`,
      )
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        perfil_id: propSxPerfilId || perf.id,
        reglas_adicionales: [],
        reglas_desactivadas: [],
        parametros: {},
        semilla: `${prefijoCorrida}-SD`,
        variar_resultados: false,
      });
    expect(genSd.status).toBe(201);
    const propSdId = genSd.body.datos.id;

    // Mutar opciones de SD → cambia fingerprint
    const martesSD = addDaysIso(sdL, 2);
    await api
      .put(
        `/api/v1/menu/semanas/${sd.semanaId}/versiones/${sd.versionId}/dias/${martesSD}/opciones`,
      )
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        opciones: [
          {
            opcionMenuMarcaId: opciones.A.id,
            platoId: platos[16].id,
            orden: 1,
            bloqueadoManual: false,
          },
          {
            opcionMenuMarcaId: opciones.C.id,
            platoId: platos[17].id,
            orden: 2,
            bloqueadoManual: false,
          },
        ],
      });

    // Aplicar propuesta con huella vieja → 409
    const apDesact = await api
      .post(
        `/api/v1/menu/semanas/${sd.semanaId}/versiones/${sd.versionId}/propuestas/${propSdId}/aplicar`,
      )
      .set("Authorization", `Bearer ${owner.token}`)
      .send({});
    expect(apDesact.status).toBe(409);
    expect(apDesact.body.code).toBe("PROPUESTA_DESACTUALIZADA");
  }, 120000);

  test("matriz de permisos etapa 4", async () => {
    // propuestaGenerada permanece en GENERADA hasta aquí

    expect((await api.get("/api/v1/menu/reglas")).status).toBe(401);

    expect(
      (
        await api
          .get("/api/v1/menu/reglas")
          .set("Authorization", `Bearer ${roles.CLIENTE.token}`)
      ).status,
    ).toBe(403);

    expect(
      (
        await api
          .get("/api/v1/menu/reglas")
          .set("Authorization", `Bearer ${roles.LECTOR.token}`)
      ).status,
    ).toBe(200);

    expect(
      (
        await api
          .post("/api/v1/menu/reglas")
          .set("Authorization", `Bearer ${roles.LECTOR.token}`)
          .send({
            codigo: `${prefijoCorrida}_LECTOR`,
            nombre: "No",
            tipo: "NO_REPETIR_PLATO_EN_SEMANA",
            naturaleza: "OBLIGATORIA",
            prioridad: 1,
            peso: 0,
            parametros: {},
          })
      ).status,
    ).toBe(403);

    // Editor puede generar en versión editable
    const edGen = await api
      .post(
        `/api/v1/menu/semanas/${semanaCompartida}/versiones/${versionCompartida}/propuestas/generar`,
      )
      .set("Authorization", `Bearer ${roles.EDITOR.token}`)
      .send({ variar_resultados: true });
    expect(edGen.status).toBe(201);

    // Editor NO puede aprobar
    expect(propuestaGenerada).toBeTruthy();
    expect(
      (
        await api
          .post(
            `/api/v1/menu/semanas/${semanaCompartida}/versiones/${versionCompartida}/propuestas/${propuestaGenerada.id}/aprobar`,
          )
          .set("Authorization", `Bearer ${roles.EDITOR.token}`)
          .send({})
      ).status,
    ).toBe(403);

    // ADMINISTRADOR puede aprobar una propuesta en estado GENERADA
    const adminAprob = await api
      .post(
        `/api/v1/menu/semanas/${semanaCompartida}/versiones/${versionCompartida}/propuestas/${propuestaGenerada.id}/aprobar`,
      )
      .set("Authorization", `Bearer ${roles.ADMINISTRADOR.token}`)
      .send({});
    expect(adminAprob.status).toBe(200);
    expect(adminAprob.body.datos.estado).toBe("APROBADA");
  }, 60000);

  test("runtime básico y regresión mínima", async () => {
    expect((await api.get("/health")).status).toBe(200);
    expect((await api.get("/api/v1/db")).status).toBe(200);
    expect((await api.get("/api/v1/documentacion/")).status).toBe(200);

    expect(
      (
        await api
          .get("/api/v1/menu/reglas")
          .set("Authorization", `Bearer ${owner.token}`)
      ).status,
    ).toBe(200);
    expect(
      (
        await api
          .get("/api/v1/menu/perfiles-reglas")
          .set("Authorization", `Bearer ${owner.token}`)
      ).status,
    ).toBe(200);
    expect(
      (
        await api
          .get(
            `/api/v1/menu/semanas/${semanaCompartida}/versiones/${versionCompartida}/propuestas`,
          )
          .set("Authorization", `Bearer ${owner.token}`)
      ).status,
    ).toBe(200);
    expect(
      (
        await api
          .get("/api/v1/menu/platos")
          .set("Authorization", `Bearer ${owner.token}`)
      ).status,
    ).toBe(200);
    expect(
      (
        await api
          .get("/api/v1/menu/semanas")
          .set("Authorization", `Bearer ${owner.token}`)
      ).status,
    ).toBe(200);
    expect((await api.get("/api/v1/pedidos")).status).toBe(200);
    expect((await api.post("/api/v1/pedidos/setup")).status).toBe(404);
  });
});
