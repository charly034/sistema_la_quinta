import { beforeAll, afterAll, describe, expect, test } from "@jest/globals";
import {
  bootstrapApi,
  login,
  limpiarDatosE3G,
  crearFixtureSemanalPublicado,
  crearPlatoBasico,
  crearAliasPlato,
  construirPayloadImportacion,
  addDaysIso,
  calcularHashSha256,
} from "./etapa3g.utils.js";

let api;
let closeDb;
let pool;
let owner;
let fixture;

function assertRespuestaControlada(body) {
  const s = JSON.stringify(body || {});
  expect(s).not.toMatch(/SELECT\s|INSERT\s|UPDATE\s|DELETE\s/i);
  expect(s).not.toMatch(/stack|trace/i);
  expect(s).not.toMatch(/password|token|jwt/i);
}

describe("Etapa 3G - Importación, hash, concurrencia y errores", () => {
  beforeAll(async () => {
    const boot = await bootstrapApi("etapa3g-imports");
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

    await limpiarDatosE3G(pool);

    fixture = await crearFixtureSemanalPublicado({
      api,
      ownerToken: owner.token,
      pool,
      ownerUserId: owner.id,
      semanaIndex: 4,
    });
  }, 240000);

  afterAll(async () => {
    if (pool) {
      await limpiarDatosE3G(pool);
    }
    if (closeDb) {
      await closeDb();
    }
  });

  test("semántica hash: dry-run A, real A, duplicada A, fallida B y retry B", async () => {
    const lunesA = addDaysIso(fixture.lunes, 14);
    const payloadA = construirPayloadImportacion({
      nombreArchivo: "E3G-A.json",
      marcaId: fixture.marca.id,
      lunes: lunesA,
      opcionAId: fixture.opciones.A.id,
      opcionCId: fixture.opciones.C.id,
      platoId: fixture.platoA.id,
    });

    const dryA = await api
      .post("/api/v1/menus-semanales/importar")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ ...payloadA, modoSimulacion: true });
    expect(dryA.status).toBe(200);

    const realA = await api
      .post("/api/v1/menus-semanales/importar")
      .set("Authorization", `Bearer ${owner.token}`)
      .send(payloadA);
    expect(realA.status).toBe(201);

    const dupA = await api
      .post("/api/v1/menus-semanales/importar")
      .set("Authorization", `Bearer ${owner.token}`)
      .send(payloadA);
    expect(dupA.status).toBe(409);
    expect(dupA.body.code).toBe("IMPORTACION_DUPLICADA");

    const lunesB = addDaysIso(fixture.lunes, 21);
    const fallidaB = construirPayloadImportacion({
      nombreArchivo: "E3G-B.json",
      marcaId: fixture.marca.id,
      lunes: lunesB,
      opcionAId: "00000000-0000-0000-0000-000000000000",
      opcionCId: fixture.opciones.C.id,
      platoId: "00000000-0000-0000-0000-000000000000",
    });

    const fallo = await api
      .post("/api/v1/menus-semanales/importar")
      .set("Authorization", `Bearer ${owner.token}`)
      .send(fallidaB);
    expect(fallo.status).toBe(400);

    const retryB = construirPayloadImportacion({
      nombreArchivo: "E3G-B-fix.json",
      marcaId: fixture.marca.id,
      lunes: lunesB,
      opcionAId: fixture.opciones.A.id,
      opcionCId: fixture.opciones.C.id,
      platoId: fixture.platoA.id,
    });

    const retry = await api
      .post("/api/v1/menus-semanales/importar")
      .set("Authorization", `Bearer ${owner.token}`)
      .send(retryB);
    expect(retry.status).toBe(201);
  });

  test("importación: resolución por id, nombre, alias y plato incompleto", async () => {
    const baseLunes = addDaysIso(fixture.lunes, 28);

    const platoNombre = await crearPlatoBasico(pool, {
      marcaId: fixture.marca.id,
      nombre: "E3G Plato Nombre",
      codigo: "E3G_NOMBRE",
      usuarioId: owner.id,
    });

    const platoAlias = await crearPlatoBasico(pool, {
      marcaId: fixture.marca.id,
      nombre: "E3G Plato Alias",
      codigo: "E3G_ALIAS",
      usuarioId: owner.id,
    });
    await crearAliasPlato(pool, platoAlias.id, "E3G Alias Importable");

    const porId = construirPayloadImportacion({
      nombreArchivo: "E3G-ID.json",
      marcaId: fixture.marca.id,
      lunes: baseLunes,
      opcionAId: fixture.opciones.A.id,
      opcionCId: fixture.opciones.C.id,
      platoId: fixture.platoA.id,
    });

    const porNombre = construirPayloadImportacion({
      nombreArchivo: "E3G-NOMBRE.json",
      marcaId: fixture.marca.id,
      lunes: addDaysIso(baseLunes, 7),
      opcionAId: fixture.opciones.A.id,
      opcionCId: fixture.opciones.C.id,
      platoNombre: "e3g plato nombre",
    });

    const porAlias = construirPayloadImportacion({
      nombreArchivo: "E3G-ALIAS.json",
      marcaId: fixture.marca.id,
      lunes: addDaysIso(baseLunes, 14),
      opcionAId: fixture.opciones.A.id,
      opcionCId: fixture.opciones.C.id,
      platoAlias: "e3g alias importable",
    });

    const incompleto = construirPayloadImportacion({
      nombreArchivo: "E3G-INCOMPLETO.json",
      marcaId: fixture.marca.id,
      lunes: addDaysIso(baseLunes, 21),
      opcionAId: fixture.opciones.A.id,
      opcionCId: fixture.opciones.C.id,
      platoNombre: "E3G Plato Pendiente Revisión",
    });

    const r1 = await api
      .post("/api/v1/menus-semanales/importar")
      .set("Authorization", `Bearer ${owner.token}`)
      .send(porId);
    expect(r1.status).toBe(201);

    const r2 = await api
      .post("/api/v1/menus-semanales/importar")
      .set("Authorization", `Bearer ${owner.token}`)
      .send(porNombre);
    expect(r2.status).toBe(201);

    const r3 = await api
      .post("/api/v1/menus-semanales/importar")
      .set("Authorization", `Bearer ${owner.token}`)
      .send(porAlias);
    expect(r3.status).toBe(201);

    const r4 = await api
      .post("/api/v1/menus-semanales/importar")
      .set("Authorization", `Bearer ${owner.token}`)
      .send(incompleto);
    expect(r4.status).toBe(201);

    const incompletoDb = await pool.query(
      `SELECT id, estado, marca_id, observaciones
       FROM platos
       WHERE nombre_normalizado = 'e3g plato pendiente revision'
       ORDER BY creado_en DESC
       LIMIT 1`,
    );

    expect(incompletoDb.rows[0]).toBeDefined();
    expect(incompletoDb.rows[0].estado).toBe("INACTIVO");
    expect(incompletoDb.rows[0].marca_id).toBe(fixture.marca.id);
    expect(incompletoDb.rows[0].observaciones).toMatch(
      /Pendiente de revisión/i,
    );

    const ingredientes = await pool.query(
      `SELECT COUNT(*)::int AS n FROM platos_ingredientes WHERE plato_id = $1`,
      [incompletoDb.rows[0].id],
    );
    const alergenos = await pool.query(
      `SELECT COUNT(*)::int AS n FROM platos_alergenos WHERE plato_id = $1`,
      [incompletoDb.rows[0].id],
    );
    expect(ingredientes.rows[0].n).toBe(0);
    expect(alergenos.rows[0].n).toBe(0);
  });

  test("hash y concurrencia: una completa, otra 409, sin duplicados", async () => {
    const lunes = addDaysIso(fixture.lunes, 70);
    const payload = construirPayloadImportacion({
      nombreArchivo: "E3G-CONC.json",
      marcaId: fixture.marca.id,
      lunes,
      opcionAId: fixture.opciones.A.id,
      opcionCId: fixture.opciones.C.id,
      platoId: fixture.platoA.id,
    });

    const hash = calcularHashSha256(payload.datos);

    const [a, b] = await Promise.all([
      api
        .post("/api/v1/menus-semanales/importar")
        .set("Authorization", `Bearer ${owner.token}`)
        .send(payload),
      api
        .post("/api/v1/menus-semanales/importar")
        .set("Authorization", `Bearer ${owner.token}`)
        .send(payload),
    ]);

    const statuses = [a.status, b.status].sort((x, y) => x - y);
    expect(statuses).toEqual([201, 409]);

    const semana = await pool.query(
      `SELECT COUNT(*)::int AS n FROM semanas_menu WHERE marca_id = $1 AND fecha_inicio = $2`,
      [fixture.marca.id, lunes],
    );
    expect(semana.rows[0].n).toBe(1);

    const importaciones = await pool.query(
      `SELECT COUNT(*)::int AS n
       FROM importaciones_menu
       WHERE hash_archivo = $1 AND estado = 'COMPLETADA' AND modo_simulacion = false`,
      [hash],
    );
    expect(importaciones.rows[0].n).toBe(1);
  });

  test("opción duplicada en día retorna 409 controlado sin fugas", async () => {
    const lunes = addDaysIso(fixture.lunes, 84);
    const payload = construirPayloadImportacion({
      nombreArchivo: "E3G-DUP-OPCION.json",
      marcaId: fixture.marca.id,
      lunes,
      opcionAId: fixture.opciones.A.id,
      opcionCId: fixture.opciones.C.id,
      platoId: fixture.platoA.id,
    });

    payload.datos.semanas[0].dias[1].opciones.push({
      opcion_menu_marca_id: fixture.opciones.A.id,
      plato_nombre: "E3G repetido",
      orden: 3,
    });

    const antesOpciones = await pool.query(
      `SELECT COUNT(*)::int AS n FROM opciones_dia_menu`,
    );
    const antesAudit = await pool.query(
      `SELECT COUNT(*)::int AS n FROM auditoria WHERE accion = 'IMPORTAR_JSON'`,
    );

    const res = await api
      .post("/api/v1/menus-semanales/importar")
      .set("Authorization", `Bearer ${owner.token}`)
      .send(payload);

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("OPCION_DUPLICADA_EN_DIA");
    assertRespuestaControlada(res.body);

    const despuesOpciones = await pool.query(
      `SELECT COUNT(*)::int AS n FROM opciones_dia_menu`,
    );
    const despuesAudit = await pool.query(
      `SELECT COUNT(*)::int AS n FROM auditoria WHERE accion = 'IMPORTAR_JSON'`,
    );

    expect(despuesOpciones.rows[0].n).toBe(antesOpciones.rows[0].n);
    expect(despuesAudit.rows[0].n).toBe(antesAudit.rows[0].n);
  });

  test("matriz de errores de dominio sin SQL/stack/secrets", async () => {
    const casos = [
      {
        nombre: "SEMANA_NO_ENCONTRADA",
        call: () =>
          api
            .get(`/api/v1/menu/semanas/00000000-0000-0000-0000-000000000000`)
            .set("Authorization", `Bearer ${owner.token}`),
        status: 404,
      },
      {
        nombre: "FECHA_INICIO_NO_ES_LUNES",
        call: () =>
          api
            .post("/api/v1/menu/semanas")
            .set("Authorization", `Bearer ${owner.token}`)
            .send({
              marcaId: fixture.marca.id,
              canalId: null,
              empresaId: null,
              fechaInicio: "2037-08-05",
              fechaFin: "2037-08-11",
            }),
        status: 400,
      },
      {
        nombre: "CONFLICTO_IMPORTACION",
        call: () =>
          api
            .post("/api/v1/menus-semanales/importar")
            .set("Authorization", `Bearer ${owner.token}`)
            .send(
              construirPayloadImportacion({
                nombreArchivo: "E3G-CONFLICTO.json",
                marcaId: fixture.marca.id,
                lunes: fixture.lunes,
                opcionAId: fixture.opciones.A.id,
                opcionCId: fixture.opciones.C.id,
                platoId: fixture.platoA.id,
              }),
            ),
        status: 409,
      },
    ];

    for (const c of casos) {
      const res = await c.call();
      expect(res.status).toBe(c.status);
      assertRespuestaControlada(res.body);
    }
  });
});
