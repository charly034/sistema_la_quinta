import { beforeAll, afterAll, describe, expect, test } from "@jest/globals";
import ExcelJS from "exceljs";
import { randomUUID } from "node:crypto";
import {
  bootstrapApi,
  login,
  limpiarDatosE3G,
  crearFixtureSemanalPublicado,
  crearUsuarioConRol,
  obtenerMarcaLaQuinta,
  asegurarPlantillasPredeterminadasWhatsapp,
} from "./etapa3g.utils.js";

function parseBinary(res, callback) {
  const data = [];
  res.on("data", (chunk) => data.push(chunk));
  res.on("end", () => callback(null, Buffer.concat(data)));
}

let api;
let closeDb;
let pool;
let owner;
let fixture;
let roles;

function sinFugaTecnica(body) {
  const texto = JSON.stringify(body || {});
  expect(texto).not.toMatch(/SELECT\s|INSERT\s|UPDATE\s|DELETE\s/i);
  expect(texto).not.toMatch(/stack|trace|password|token/i);
}

describe("Etapa 3G - Runtime reproducible permanente", () => {
  beforeAll(async () => {
    const boot = await bootstrapApi("etapa3g-runtime");
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
    await asegurarPlantillasPredeterminadasWhatsapp(pool, owner.id);

    fixture = await crearFixtureSemanalPublicado({
      api,
      ownerToken: owner.token,
      pool,
      ownerUserId: owner.id,
      semanaIndex: 2,
    });

    const sufijoRoles = `runtime-${randomUUID().slice(0, 8)}`;

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
    };
  }, 240000);

  afterAll(async () => {
    if (pool) {
      await limpiarDatosE3G(pool);
    }
    if (closeDb) {
      await closeDb();
    }
  });

  test("plantillas predeterminadas por contexto y fallback global", async () => {
    const marca = await obtenerMarcaLaQuinta(pool);

    const activas = await pool.query(
      `SELECT id, marca_id, canal_id, empresa_id, estado, es_predeterminada
       FROM plantillas_mensaje_menu
       WHERE estado = 'ACTIVA' AND es_predeterminada = true AND eliminado_en IS NULL`,
    );

    expect(activas.rows.some((r) => r.marca_id === marca.id)).toBe(true);
    expect(
      activas.rows.some((r) => !r.marca_id && !r.canal_id && !r.empresa_id),
    ).toBe(true);

    const duplicados = await pool.query(
      `SELECT
         COALESCE(marca_id::text, 'NULL') AS marca,
         COALESCE(canal_id::text, 'NULL') AS canal,
         COALESCE(empresa_id::text, 'NULL') AS empresa,
         COUNT(*)::int AS n
       FROM plantillas_mensaje_menu
       WHERE estado = 'ACTIVA' AND es_predeterminada = true AND eliminado_en IS NULL
       GROUP BY marca_id, canal_id, empresa_id
       HAVING COUNT(*) > 1`,
    );
    expect(duplicados.rows).toHaveLength(0);

    const seleccionMarca = await pool.query(
      `SELECT id
       FROM plantillas_mensaje_menu
       WHERE tipo = 'WHATSAPP'
         AND estado = 'ACTIVA'
         AND es_predeterminada = true
         AND eliminado_en IS NULL
         AND marca_id = $1
         AND canal_id IS NULL
         AND empresa_id IS NULL
       LIMIT 1`,
      [marca.id],
    );
    expect(seleccionMarca.rows[0]).toBeDefined();
  });

  test("whatsapp runtime con fixture semanal completo", async () => {
    const res = await api
      .get(`/api/v1/menu/semanas/${fixture.semanaId}/mensaje-whatsapp`)
      .set("Authorization", `Bearer ${owner.token}`);

    expect(res.status).toBe(200);
    const mensaje = res.body?.datos?.mensaje;
    expect(mensaje).toBeTruthy();

    expect(mensaje).toMatch(/🗓️ SEMANA \d{2}\/\d{2} AL \d{2}\/\d{2}/);
    expect(mensaje).toMatch(/📍 Lunes\nFERIADO/);
    expect(mensaje).toMatch(/📍 Martes \d{2}\/\d{2}/);
    expect(mensaje).toMatch(/A: /);
    expect(mensaje).toMatch(/C: /);
    expect(mensaje).not.toMatch(/📍 Sábado/);
    expect(mensaje).not.toMatch(/📍 Domingo/);
    expect(mensaje).not.toMatch(/DIA_LABORAL\n\n/);
  });

  test("exportación de texto y excel válidas", async () => {
    const texto = await api
      .get(`/api/v1/menu/semanas/${fixture.semanaId}/exportar/texto`)
      .query({ versionId: fixture.versionId })
      .set("Authorization", `Bearer ${owner.token}`);

    expect(texto.status).toBe(200);
    expect(texto.body?.datos?.contenido).toContain("MENÚ SEMANAL");
    expect(texto.body?.datos?.contenido).toContain("LUNES");
    expect(texto.body?.datos?.nombre).toMatch(/^menu-[a-z0-9-]+-.*\.txt$/);
    expect(texto.body?.datos?.nombre).not.toMatch(/[\\/\s]/);

    const excel = await api
      .get(`/api/v1/menu/semanas/${fixture.semanaId}/exportar/excel`)
      .query({ versionId: fixture.versionId })
      .set("Authorization", `Bearer ${owner.token}`)
      .buffer(true)
      .parse(parseBinary);

    expect(excel.status).toBe(200);
    expect(excel.headers["content-type"]).toContain(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    expect(excel.headers["content-disposition"]).toMatch(/menu-.*\.xlsx/);
    expect(excel.body.length).toBeGreaterThan(0);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(excel.body);
    const ws = workbook.getWorksheet("Menú Semanal");
    expect(ws).toBeDefined();
    expect(ws.getCell("A1").value).toMatch(/MENÚ SEMANAL/);

    const valores = [];
    ws.eachRow((row) => {
      valores.push(row.values.join(" | "));
    });
    const dump = valores.join("\n");
    expect(dump).toContain("Lunes");
    expect(dump).toMatch(/Feriado|FERIADO/);
    expect(dump).toContain("A)");
    expect(dump).toMatch(/A\)\s+A/);
    expect(dump).toMatch(/[A-Z]\)\s+C/);
  });

  test("historial cuantitativo canónico", async () => {
    const res = await api
      .get(`/api/v1/menu/platos/${fixture.platoA.id}/historial-uso`)
      .query({ marcaId: fixture.marca.id })
      .set("Authorization", `Bearer ${owner.token}`);

    expect(res.status).toBe(200);
    const historial = res.body?.datos?.historial || [];
    expect(historial.length).toBeGreaterThanOrEqual(1);

    const totalUsos = historial.reduce(
      (acc, s) => acc + (s.diasEnQueSirve?.length || 0),
      0,
    );
    expect(totalUsos).toBeGreaterThanOrEqual(4);

    const ultima = historial[0];
    expect(String(ultima.fechaInicio).slice(0, 10)).toBe(fixture.lunes);
  });

  test("matriz de permisos sin contaminación de negocio", async () => {
    const sinToken = await api.get("/api/v1/menu/semanas");
    expect(sinToken.status).toBe(401);

    const cliente = await api
      .get("/api/v1/menu/semanas")
      .set("Authorization", `Bearer ${roles.CLIENTE.token}`);
    expect(cliente.status).toBe(403);

    const lectorLeer = await api
      .get("/api/v1/menu/semanas")
      .set("Authorization", `Bearer ${roles.LECTOR.token}`);
    expect(lectorLeer.status).toBe(200);

    const lectorGestionar = await api
      .post("/api/v1/menu/semanas")
      .set("Authorization", `Bearer ${roles.LECTOR.token}`)
      .send({
        marcaId: fixture.marca.id,
        canalId: null,
        empresaId: null,
        fechaInicio: "2037-08-03",
        fechaFin: "2037-08-09",
      });
    expect(lectorGestionar.status).toBe(403);

    const editorGestionar = await api
      .post("/api/v1/menu/semanas")
      .set("Authorization", `Bearer ${roles.EDITOR.token}`)
      .send({
        marcaId: fixture.marca.id,
        canalId: null,
        empresaId: null,
        fechaInicio: "2037-08-10",
        fechaFin: "2037-08-16",
      });
    expect([200, 201]).toContain(editorGestionar.status);

    const editorAprobar = await api
      .post(
        `/api/v1/menu/semanas/${fixture.semanaId}/versiones/${fixture.versionId}/aprobar`,
      )
      .set("Authorization", `Bearer ${roles.EDITOR.token}`)
      .send({ motivo: "Sin permiso" });
    expect(editorAprobar.status).toBe(403);

    const adminAprobar = await api
      .post(
        `/api/v1/menu/semanas/${fixture.semanaId}/versiones/${fixture.versionId}/aprobar`,
      )
      .set("Authorization", `Bearer ${roles.ADMINISTRADOR.token}`)
      .send({ motivo: "Reintento" });
    expect([200, 400, 409]).toContain(adminAprobar.status);

    const ownerImportar = await api
      .post("/api/v1/menus-semanales/importar")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        modoSimulacion: true,
        estrategiaConflicto: "ERROR",
        nombreArchivo: "E3G-permisos.json",
        datos: { semanas: [] },
      });
    expect([200, 400]).toContain(ownerImportar.status);
  });

  test("runtime final básico reproducible", async () => {
    const health = await api.get("/health");
    expect(health.status).toBe(200);

    const db = await api.get("/api/v1/db");
    expect(db.status).toBe(200);

    const docs = await api.get("/api/v1/documentacion/");
    expect(docs.status).toBe(200);

    const pedidos = await api.get("/api/v1/pedidos");
    expect(pedidos.status).toBe(200);

    const menuPlatos = await api
      .get("/api/v1/menu/platos")
      .set("Authorization", `Bearer ${owner.token}`);
    expect(menuPlatos.status).toBe(200);

    const menuSemanas = await api
      .get("/api/v1/menu/semanas")
      .set("Authorization", `Bearer ${owner.token}`);
    expect(menuSemanas.status).toBe(200);

    const semanaDetalle = await api
      .get(`/api/v1/menu/semanas/${fixture.semanaId}`)
      .set("Authorization", `Bearer ${owner.token}`);
    expect(semanaDetalle.status).toBe(200);

    const versiones = await api
      .get(`/api/v1/menu/semanas/${fixture.semanaId}/versiones`)
      .set("Authorization", `Bearer ${owner.token}`);
    expect(versiones.status).toBe(200);

    const whatsapp = await api
      .get(`/api/v1/menu/semanas/${fixture.semanaId}/mensaje-whatsapp`)
      .set("Authorization", `Bearer ${owner.token}`);
    expect(whatsapp.status).toBe(200);

    const exportTexto = await api
      .get(`/api/v1/menu/semanas/${fixture.semanaId}/exportar/texto`)
      .query({ versionId: fixture.versionId })
      .set("Authorization", `Bearer ${owner.token}`);
    expect(exportTexto.status).toBe(200);

    const exportExcel = await api
      .get(`/api/v1/menu/semanas/${fixture.semanaId}/exportar/excel`)
      .query({ versionId: fixture.versionId })
      .set("Authorization", `Bearer ${owner.token}`);
    expect(exportExcel.status).toBe(200);

    const historial = await api
      .get(`/api/v1/menu/platos/${fixture.platoA.id}/historial-uso`)
      .query({ marcaId: fixture.marca.id })
      .set("Authorization", `Bearer ${owner.token}`);
    expect(historial.status).toBe(200);

    const setup = await api.post("/api/v1/pedidos/setup");
    expect(setup.status).toBe(404);

    sinFugaTecnica(setup.body);
  });
});
