import { beforeAll, afterAll, describe, expect, test } from "@jest/globals";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { randomUUID } from "crypto";
import request from "supertest";

const ROOT_API = path.resolve(process.cwd());
const ENV_PATH = path.join(ROOT_API, ".env");

function cargarDatabaseUrlPruebas() {
  const texto = fs.readFileSync(ENV_PATH, "utf8");
  const match = texto.match(/^\s*DATABASE_URL_PRUEBAS\s*=\s*(.+)\s*$/m);
  if (!match)
    throw new Error("DATABASE_URL_PRUEBAS no definida en apps/api/.env");
  return match[1].trim().replace(/^['\"]|['\"]$/g, "");
}

function prepararEntornoPruebas() {
  process.env.DATABASE_URL_PRUEBAS = cargarDatabaseUrlPruebas();
  process.env.JWT_SECRETO_ACCESO = `etapa2b-${randomUUID()}`;
  process.env.NODE_ENV = "test";

  delete process.env.DATABASE_URL;
  delete process.env.DB_HOST;
  delete process.env.DB_PORT;
  delete process.env.DB_NAME;
  delete process.env.DB_USER;
  delete process.env.DB_PASSWORD;
  delete process.env.DB_SSL;
}

function ejecutarComando(comando) {
  execSync(comando, {
    cwd: ROOT_API,
    stdio: "pipe",
    env: {
      ...process.env,
      DATABASE_URL_PRUEBAS: process.env.DATABASE_URL_PRUEBAS,
      JWT_SECRETO_ACCESO: process.env.JWT_SECRETO_ACCESO,
    },
  });
}

let api;
let initDb;
let closeDb;
let createApp;

const credencialesPrueba = {
  propietarioContrasena: `Tmp-${randomUUID()}`,
  usuarioRolContrasena: `Tmp-${randomUUID()}`,
};

const auth = {
  owner: null,
  admin: null,
  editor: null,
  lector: null,
  cliente: null,
};

const ids = {
  marcaPrincipal: null,
  marcaSecundaria: null,
  platos: {},
  categorias: {},
  proteinas: {},
  etiquetas: {},
  ingredientes: {},
  alergenos: {},
  caracteristicas: {},
};

const recursos = [
  { key: "categorias", path: "categorias", requiereMarca: true },
  { key: "proteinas", path: "proteinas", requiereMarca: true },
  { key: "etiquetas", path: "etiquetas", requiereMarca: true },
  { key: "ingredientes", path: "ingredientes", requiereMarca: true },
  { key: "alergenos", path: "alergenos", requiereMarca: false },
  {
    key: "caracteristicas",
    path: "caracteristicas-alimentarias",
    requiereMarca: true,
  },
];

async function login(correo, contrasena) {
  return api
    .post("/api/v1/autenticacion/iniciar-sesion")
    .send({ correo, contrasena });
}

async function crearUsuarioConRol(rolCodigo, correo) {
  const crear = await api
    .post("/api/v1/usuarios")
    .set("Authorization", `Bearer ${auth.owner}`)
    .send({
      correo,
      contrasena: credencialesPrueba.usuarioRolContrasena,
      nombre: `Usuario ${rolCodigo}`,
      estado: "ACTIVO",
    });
  expect(crear.status).toBe(201);

  const asignar = await api
    .put(`/api/v1/usuarios/${crear.body.datos.id}/roles`)
    .set("Authorization", `Bearer ${auth.owner}`)
    .send({ roles: [rolCodigo] });
  expect(asignar.status).toBe(200);

  const acceso = await login(correo, credencialesPrueba.usuarioRolContrasena);
  expect(acceso.status).toBe(200);
  return acceso.body.datos.accessToken;
}

async function crearClasificacion(pathRecurso, payload) {
  const res = await api
    .post(`/api/v1/menu/${pathRecurso}`)
    .set("Authorization", `Bearer ${auth.admin}`)
    .send(payload);
  expect(res.status).toBe(201);
  return res.body.datos.id;
}

describe("Etapa 2B integracion real", () => {
  beforeAll(async () => {
    prepararEntornoPruebas();

    const dbModule = await import("../config/db.js");
    initDb = dbModule.initDb;
    closeDb = dbModule.closeDb;

    const appModule = await import("../app.js");
    createApp = appModule.createApp;

    ejecutarComando("node ./scripts/reset-db-etapa1c.cjs");
    ejecutarComando("npm run migrar:subir");

    process.env.CORREO_PROPETARIO = "propietario.pruebas@laquinta.local";
    process.env.CONTRASENA_PROPETARIO =
      credencialesPrueba.propietarioContrasena;
    process.env.NOMBRE_PROPETARIO = "Propietario Pruebas";
    ejecutarComando("node ./scripts/crear-propietario.js");

    await initDb();
    api = request(createApp());

    const loginOwner = await login(
      "propietario.pruebas@laquinta.local",
      credencialesPrueba.propietarioContrasena,
    );
    expect(loginOwner.status).toBe(200);
    auth.owner = loginOwner.body.datos.accessToken;

    const marcas = await api
      .get("/api/v1/marcas")
      .set("Authorization", `Bearer ${auth.owner}`);
    expect(marcas.status).toBe(200);
    ids.marcaPrincipal = marcas.body.datos[0].id;

    const crearMarca2 = await api
      .post("/api/v1/marcas")
      .set("Authorization", `Bearer ${auth.owner}`)
      .send({ codigo: "ET2B_OTRA", nombre: "Marca ET2B Secundaria" });
    expect(crearMarca2.status).toBe(201);
    ids.marcaSecundaria = crearMarca2.body.datos.id;

    auth.admin = await crearUsuarioConRol(
      "ADMINISTRADOR",
      "admin.et2b@laquinta.local",
    );
    auth.editor = await crearUsuarioConRol(
      "EDITOR",
      "editor.et2b@laquinta.local",
    );
    auth.lector = await crearUsuarioConRol(
      "LECTOR",
      "lector.et2b@laquinta.local",
    );
    auth.cliente = await crearUsuarioConRol(
      "CLIENTE",
      "cliente.et2b@laquinta.local",
    );

    ids.categorias.principal = await crearClasificacion("categorias", {
      marcaId: ids.marcaPrincipal,
      codigo: "ET2B_CAT_A",
      nombre: "Categoria A",
      descripcion: "Categoria principal",
    });
    ids.proteinas.principal = await crearClasificacion("proteinas", {
      marcaId: ids.marcaPrincipal,
      codigo: "ET2B_PROT_A",
      nombre: "Proteina A",
    });
    ids.etiquetas.principal = await crearClasificacion("etiquetas", {
      marcaId: ids.marcaPrincipal,
      codigo: "ET2B_ETQ_A",
      nombre: "Etiqueta A",
      tipo: "COMERCIAL",
    });
    ids.ingredientes.principal = await crearClasificacion("ingredientes", {
      marcaId: ids.marcaPrincipal,
      codigo: "ET2B_ING_A",
      nombre: "Ingrediente A",
    });
    ids.alergenos.principal = await crearClasificacion("alergenos", {
      codigo: "ET2B_ALER_A",
      nombre: "Alergeno A",
    });
    ids.caracteristicas.principal = await crearClasificacion(
      "caracteristicas-alimentarias",
      {
        marcaId: ids.marcaPrincipal,
        codigo: "ET2B_CAR_A",
        nombre: "Caracteristica A",
      },
    );
  }, 180000);

  afterAll(async () => {
    if (closeDb) await closeDb();
  });

  test("rutas publicas nuevas y alias transitorios responden", async () => {
    const categorias = await api
      .get(`/api/v1/menu/categorias?marcaId=${ids.marcaPrincipal}`)
      .set("Authorization", `Bearer ${auth.owner}`);
    const categoriasAlias = await api
      .get(`/api/v1/menu/categorias-plato?marcaId=${ids.marcaPrincipal}`)
      .set("Authorization", `Bearer ${auth.owner}`);
    const etiquetas = await api
      .get(`/api/v1/menu/etiquetas?marcaId=${ids.marcaPrincipal}`)
      .set("Authorization", `Bearer ${auth.owner}`);
    const etiquetasAlias = await api
      .get(`/api/v1/menu/etiquetas-plato?marcaId=${ids.marcaPrincipal}`)
      .set("Authorization", `Bearer ${auth.owner}`);

    expect(categorias.status).toBe(200);
    expect(categoriasAlias.status).toBe(200);
    expect(etiquetas.status).toBe(200);
    expect(etiquetasAlias.status).toBe(200);
  });

  test("seguridad por rol especifica de Etapa 2", async () => {
    const sinToken = await api.get("/api/v1/menu/platos");
    expect(sinToken.status).toBe(401);

    const clienteLee = await api
      .get("/api/v1/menu/platos")
      .set("Authorization", `Bearer ${auth.cliente}`);
    expect(clienteLee.status).toBe(403);

    const lectorLee = await api
      .get("/api/v1/menu/platos")
      .set("Authorization", `Bearer ${auth.lector}`);
    expect(lectorLee.status).toBe(200);

    const lectorCrea = await api
      .post("/api/v1/menu/platos")
      .set("Authorization", `Bearer ${auth.lector}`)
      .send({ marcaId: ids.marcaPrincipal, tipo: "PREPARACION", nombre: "No" });
    expect(lectorCrea.status).toBe(403);

    const editorGestionaPlato = await api
      .post("/api/v1/menu/platos")
      .set("Authorization", `Bearer ${auth.editor}`)
      .send({
        marcaId: ids.marcaPrincipal,
        tipo: "PREPARACION",
        codigo: "ET2B_EDITOR",
        nombre: "Plato Editor",
      });
    expect(editorGestionaPlato.status).toBe(201);

    const editorGestionaClasificacion = await api
      .post("/api/v1/menu/categorias")
      .set("Authorization", `Bearer ${auth.editor}`)
      .send({
        marcaId: ids.marcaPrincipal,
        codigo: "ET2B_EDITOR_CAT",
        nombre: "Categoria Editor",
      });
    expect(editorGestionaClasificacion.status).toBe(403);

    const adminGestionaClasificacion = await api
      .post("/api/v1/menu/categorias")
      .set("Authorization", `Bearer ${auth.admin}`)
      .send({
        marcaId: ids.marcaPrincipal,
        codigo: "ET2B_ADMIN_CAT",
        nombre: "Categoria Admin",
      });
    expect(adminGestionaClasificacion.status).toBe(201);
  });

  test("crud y permisos de clasificaciones para todos los recursos", async () => {
    for (const recurso of recursos) {
      const basePayload = {
        codigo: `ET2B_${recurso.key.toUpperCase()}_B`,
        nombre: `${recurso.key} B`,
      };
      if (recurso.requiereMarca) {
        basePayload.marcaId = ids.marcaPrincipal;
      }

      const sinToken = await api.get(`/api/v1/menu/${recurso.path}`);
      expect(sinToken.status).toBe(401);

      const sinPermiso = await api
        .get(`/api/v1/menu/${recurso.path}`)
        .set("Authorization", `Bearer ${auth.cliente}`);
      expect(sinPermiso.status).toBe(403);

      const lector = await api
        .get(`/api/v1/menu/${recurso.path}`)
        .set("Authorization", `Bearer ${auth.lector}`);
      expect(lector.status).toBe(200);

      const crear = await api
        .post(`/api/v1/menu/${recurso.path}`)
        .set("Authorization", `Bearer ${auth.admin}`)
        .send(basePayload);
      expect(crear.status).toBe(201);
      const creadoId = crear.body.datos.id;

      const duplicado = await api
        .post(`/api/v1/menu/${recurso.path}`)
        .set("Authorization", `Bearer ${auth.admin}`)
        .send(basePayload);
      expect(duplicado.status).toBe(409);

      const detalle = await api
        .get(`/api/v1/menu/${recurso.path}/${creadoId}`)
        .set("Authorization", `Bearer ${auth.lector}`);
      expect(detalle.status).toBe(200);

      const estadoArchivado =
        recurso.key === "ingredientes" || recurso.key === "alergenos"
          ? "ARCHIVADO"
          : "ARCHIVADA";

      const actualizar = await api
        .patch(`/api/v1/menu/${recurso.path}/${creadoId}`)
        .set("Authorization", `Bearer ${auth.admin}`)
        .send({ nombre: `${recurso.key} B editada`, estado: estadoArchivado });
      expect(actualizar.status).toBe(200);

      const listadoDefault = await api
        .get(`/api/v1/menu/${recurso.path}`)
        .set("Authorization", `Bearer ${auth.lector}`);
      expect(listadoDefault.status).toBe(200);
      expect(
        listadoDefault.body.datos.find((item) => item.id === creadoId),
      ).toBeUndefined();

      const listadoArchivadas = await api
        .get(
          `/api/v1/menu/${recurso.path}?includeArchivadas=true&buscar=${encodeURIComponent("editada")}`,
        )
        .set("Authorization", `Bearer ${auth.lector}`);
      expect(listadoArchivadas.status).toBe(200);
      expect(
        listadoArchivadas.body.datos.some((item) => item.id === creadoId),
      ).toBe(true);

      const paginado = await api
        .get(`/api/v1/menu/${recurso.path}?pagina=1&tamano=1`)
        .set("Authorization", `Bearer ${auth.lector}`);
      expect(paginado.status).toBe(200);
      expect(paginado.body.meta.tamano).toBe(1);
    }
  }, 120000);

  test("platos: duplicado normalizado, archivado y alias duplicado", async () => {
    const crear = await api
      .post("/api/v1/menu/platos")
      .set("Authorization", `Bearer ${auth.owner}`)
      .send({
        marcaId: ids.marcaPrincipal,
        tipo: "PREPARACION",
        codigo: "ET2B_DUP_1",
        nombre: "Ñoquis al pesto",
      });
    expect(crear.status).toBe(201);
    ids.platos.dup = crear.body.datos.id;

    const duplicadoNormalizado = await api
      .post("/api/v1/menu/platos")
      .set("Authorization", `Bearer ${auth.owner}`)
      .send({
        marcaId: ids.marcaPrincipal,
        tipo: "PREPARACION",
        codigo: "ET2B_DUP_2",
        nombre: "  NOQUIS   AL   PESTO ",
      });
    expect(duplicadoNormalizado.status).toBe(409);

    const archivar = await api
      .patch(`/api/v1/menu/platos/${ids.platos.dup}/estado`)
      .set("Authorization", `Bearer ${auth.owner}`)
      .send({ estado: "ARCHIVADO" });
    expect(archivar.status).toBe(200);

    const duplicadoConArchivado = await api
      .post("/api/v1/menu/platos")
      .set("Authorization", `Bearer ${auth.owner}`)
      .send({
        marcaId: ids.marcaPrincipal,
        tipo: "PREPARACION",
        codigo: "ET2B_DUP_3",
        nombre: "Noquis al pesto",
      });
    expect(duplicadoConArchivado.status).toBe(409);

    const crearAlias = await api
      .post("/api/v1/menu/platos")
      .set("Authorization", `Bearer ${auth.owner}`)
      .send({
        marcaId: ids.marcaPrincipal,
        tipo: "GUARNICION",
        codigo: "ET2B_ALIAS_BASE",
        nombre: "Papa criolla",
      });
    expect(crearAlias.status).toBe(201);
    ids.platos.alias = crearAlias.body.datos.id;

    const alias1 = await api
      .post(`/api/v1/menu/platos/${ids.platos.alias}/alias`)
      .set("Authorization", `Bearer ${auth.owner}`)
      .send({ alias: "Guarnicion de papa" });
    expect(alias1.status).toBe(201);

    const aliasDup = await api
      .post(`/api/v1/menu/platos/${ids.platos.alias}/alias`)
      .set("Authorization", `Bearer ${auth.owner}`)
      .send({ alias: "  guarnicion   DE  PAPA  " });
    expect(aliasDup.status).toBe(409);
    expect(aliasDup.body.error.codigo).toBe("ALIAS_DUPLICADO");
  });

  test("busqueda por alias, sin duplicados y baja al eliminar alias", async () => {
    const crear = await api
      .post("/api/v1/menu/platos")
      .set("Authorization", `Bearer ${auth.owner}`)
      .send({
        marcaId: ids.marcaPrincipal,
        tipo: "PLATO_COMPLETO",
        codigo: "ET2B_BUSCAR_ALIAS",
        nombre: "Milanesa especial",
      });
    expect(crear.status).toBe(201);
    const platoId = crear.body.datos.id;

    const alias = await api
      .post(`/api/v1/menu/platos/${platoId}/alias`)
      .set("Authorization", `Bearer ${auth.owner}`)
      .send({ alias: "Milanga Unica Etapa2B" });
    expect(alias.status).toBe(201);
    const aliasId = alias.body.datos.aliases.find(
      (item) => item.alias === "Milanga Unica Etapa2B",
    ).id;

    const buscarAlias = await api
      .get(
        `/api/v1/menu/platos?buscar=${encodeURIComponent("milanga unica etapa2b")}`,
      )
      .set("Authorization", `Bearer ${auth.lector}`);
    expect(buscarAlias.status).toBe(200);
    const idsResultado = buscarAlias.body.datos.map((item) => item.id);
    expect(idsResultado.filter((id) => id === platoId).length).toBe(1);

    const eliminarAlias = await api
      .delete(`/api/v1/menu/platos/${platoId}/alias/${aliasId}`)
      .set("Authorization", `Bearer ${auth.owner}`);
    expect(eliminarAlias.status).toBe(200);

    const buscarPostDelete = await api
      .get(
        `/api/v1/menu/platos?buscar=${encodeURIComponent("milanga unica etapa2b")}`,
      )
      .set("Authorization", `Bearer ${auth.lector}`);
    expect(buscarPostDelete.status).toBe(200);
    expect(
      buscarPostDelete.body.datos.some((item) => item.id === platoId),
    ).toBe(false);
  });

  test("componentes: directos/indirectos, duplicados, autorreferencia, orden y mas de dos", async () => {
    const crearA = await api
      .post("/api/v1/menu/platos")
      .set("Authorization", `Bearer ${auth.owner}`)
      .send({
        marcaId: ids.marcaPrincipal,
        tipo: "PLATO_COMPLETO",
        codigo: "ET2B_A",
        nombre: "Plato A",
      });
    const crearB = await api
      .post("/api/v1/menu/platos")
      .set("Authorization", `Bearer ${auth.owner}`)
      .send({
        marcaId: ids.marcaPrincipal,
        tipo: "PREPARACION",
        codigo: "ET2B_B",
        nombre: "Plato B",
      });
    const crearC = await api
      .post("/api/v1/menu/platos")
      .set("Authorization", `Bearer ${auth.owner}`)
      .send({
        marcaId: ids.marcaPrincipal,
        tipo: "GUARNICION",
        codigo: "ET2B_C",
        nombre: "Plato C",
      });
    const crearD = await api
      .post("/api/v1/menu/platos")
      .set("Authorization", `Bearer ${auth.owner}`)
      .send({
        marcaId: ids.marcaPrincipal,
        tipo: "PREPARACION",
        codigo: "ET2B_D",
        nombre: "Plato D",
      });

    expect(crearA.status).toBe(201);
    expect(crearB.status).toBe(201);
    expect(crearC.status).toBe(201);
    expect(crearD.status).toBe(201);

    ids.platos.A = crearA.body.datos.id;
    ids.platos.B = crearB.body.datos.id;
    ids.platos.C = crearC.body.datos.id;
    ids.platos.D = crearD.body.datos.id;

    const masDeDos = await api
      .put(`/api/v1/menu/platos/${ids.platos.A}/componentes`)
      .set("Authorization", `Bearer ${auth.owner}`)
      .send({
        componentes: [
          { platoComponenteId: ids.platos.B, funcion: "PRINCIPAL", orden: 0 },
          { platoComponenteId: ids.platos.C, funcion: "GUARNICION", orden: 1 },
          { platoComponenteId: ids.platos.D, funcion: "SALSA", orden: 2 },
        ],
      });
    expect(masDeDos.status).toBe(200);

    const getComponentes = await api
      .get(`/api/v1/menu/platos/${ids.platos.A}/componentes`)
      .set("Authorization", `Bearer ${auth.lector}`);
    expect(getComponentes.status).toBe(200);
    expect(getComponentes.body.datos.length).toBe(3);
    expect(getComponentes.body.datos.map((item) => item.orden)).toEqual([
      0, 1, 2,
    ]);

    const ordenDuplicado = await api
      .put(`/api/v1/menu/platos/${ids.platos.A}/componentes`)
      .set("Authorization", `Bearer ${auth.owner}`)
      .send({
        componentes: [
          { platoComponenteId: ids.platos.B, funcion: "PRINCIPAL", orden: 0 },
          { platoComponenteId: ids.platos.C, funcion: "GUARNICION", orden: 0 },
        ],
      });
    expect(ordenDuplicado.status).toBe(409);
    expect(ordenDuplicado.body.error.codigo).toBe("COMPONENTE_INVALIDO");

    const autorreferencia = await api
      .put(`/api/v1/menu/platos/${ids.platos.A}/componentes`)
      .set("Authorization", `Bearer ${auth.owner}`)
      .send({
        componentes: [
          { platoComponenteId: ids.platos.A, funcion: "PRINCIPAL", orden: 0 },
        ],
      });
    expect(autorreferencia.status).toBe(409);
    expect(autorreferencia.body.error.codigo).toBe("COMPONENTE_INVALIDO");

    const duplicadoPayload = await api
      .put(`/api/v1/menu/platos/${ids.platos.A}/componentes`)
      .set("Authorization", `Bearer ${auth.owner}`)
      .send({
        componentes: [
          { platoComponenteId: ids.platos.B, funcion: "PRINCIPAL", orden: 0 },
          { platoComponenteId: ids.platos.B, funcion: "GUARNICION", orden: 1 },
        ],
      });
    expect(duplicadoPayload.status).toBe(409);
    expect(duplicadoPayload.body.error.codigo).toBe("COMPONENTE_INVALIDO");

    const directA = await api
      .put(`/api/v1/menu/platos/${ids.platos.B}/componentes`)
      .set("Authorization", `Bearer ${auth.owner}`)
      .send({
        componentes: [
          { platoComponenteId: ids.platos.C, funcion: "PRINCIPAL", orden: 0 },
        ],
      });
    expect(directA.status).toBe(200);

    const directB = await api
      .put(`/api/v1/menu/platos/${ids.platos.C}/componentes`)
      .set("Authorization", `Bearer ${auth.owner}`)
      .send({
        componentes: [
          { platoComponenteId: ids.platos.B, funcion: "PRINCIPAL", orden: 0 },
        ],
      });
    expect(directB.status).toBe(409);
    expect(directB.body.error.codigo).toBe("CICLO_COMPONENTES");

    const indirect1 = await api
      .put(`/api/v1/menu/platos/${ids.platos.B}/componentes`)
      .set("Authorization", `Bearer ${auth.owner}`)
      .send({
        componentes: [
          { platoComponenteId: ids.platos.C, funcion: "PRINCIPAL", orden: 0 },
        ],
      });
    expect(indirect1.status).toBe(200);

    const indirect2 = await api
      .put(`/api/v1/menu/platos/${ids.platos.C}/componentes`)
      .set("Authorization", `Bearer ${auth.owner}`)
      .send({
        componentes: [
          { platoComponenteId: ids.platos.D, funcion: "PRINCIPAL", orden: 0 },
        ],
      });
    expect(indirect2.status).toBe(200);

    const indirect3 = await api
      .put(`/api/v1/menu/platos/${ids.platos.D}/componentes`)
      .set("Authorization", `Bearer ${auth.owner}`)
      .send({
        componentes: [
          { platoComponenteId: ids.platos.B, funcion: "PRINCIPAL", orden: 0 },
        ],
      });
    expect(indirect3.status).toBe(409);
    expect(indirect3.body.error.codigo).toBe("CICLO_COMPONENTES");
  }, 120000);

  test("componentes: rollback atomico y auditoria sin falso exito", async () => {
    const setInicial = await api
      .put(`/api/v1/menu/platos/${ids.platos.A}/componentes`)
      .set("Authorization", `Bearer ${auth.owner}`)
      .send({
        componentes: [
          { platoComponenteId: ids.platos.B, funcion: "PRINCIPAL", orden: 0 },
          { platoComponenteId: ids.platos.C, funcion: "GUARNICION", orden: 1 },
        ],
      });
    expect(setInicial.status).toBe(200);

    const antes = await api
      .get(`/api/v1/menu/platos/${ids.platos.A}/componentes`)
      .set("Authorization", `Bearer ${auth.owner}`);
    expect(antes.status).toBe(200);

    const auditAntes = await api
      .get(
        "/api/v1/auditoria?accion=REEMPLAZAR_COMPONENTES_PLATO&entidad=componentes_plato",
      )
      .set("Authorization", `Bearer ${auth.owner}`);
    expect(auditAntes.status).toBe(200);
    const totalAuditAntes = auditAntes.body.meta.total;

    const fallo = await api
      .put(`/api/v1/menu/platos/${ids.platos.A}/componentes`)
      .set("Authorization", `Bearer ${auth.owner}`)
      .send({
        componentes: [
          { platoComponenteId: ids.platos.B, funcion: "PRINCIPAL", orden: 0 },
          {
            platoComponenteId: "00000000-0000-0000-0000-000000000000",
            funcion: "GUARNICION",
            orden: 1,
          },
        ],
      });
    expect(fallo.status).toBe(409);
    expect(fallo.body.error.codigo).toBe("COMPONENTE_INVALIDO");

    const despues = await api
      .get(`/api/v1/menu/platos/${ids.platos.A}/componentes`)
      .set("Authorization", `Bearer ${auth.owner}`);
    expect(despues.status).toBe(200);
    expect(despues.body.datos).toEqual(antes.body.datos);

    const auditDespues = await api
      .get(
        "/api/v1/auditoria?accion=REEMPLAZAR_COMPONENTES_PLATO&entidad=componentes_plato",
      )
      .set("Authorization", `Bearer ${auth.owner}`);
    expect(auditDespues.status).toBe(200);
    expect(auditDespues.body.meta.total).toBe(totalAuditAntes);
  });

  test("endpoint de relaciones expone solo relaciones esperadas", async () => {
    const asociarCategorias = await api
      .put(`/api/v1/menu/platos/${ids.platos.A}/relaciones/categorias`)
      .set("Authorization", `Bearer ${auth.owner}`)
      .send({ ids: [ids.categorias.principal] });
    expect(asociarCategorias.status).toBe(200);

    const asociarProteinas = await api
      .put(`/api/v1/menu/platos/${ids.platos.A}/relaciones/proteinas`)
      .set("Authorization", `Bearer ${auth.owner}`)
      .send({ ids: [ids.proteinas.principal] });
    expect(asociarProteinas.status).toBe(200);

    const asociarEtiquetas = await api
      .put(`/api/v1/menu/platos/${ids.platos.A}/relaciones/etiquetas`)
      .set("Authorization", `Bearer ${auth.owner}`)
      .send({ ids: [ids.etiquetas.principal] });
    expect(asociarEtiquetas.status).toBe(200);

    const setIngredientes = await api
      .put(`/api/v1/menu/platos/${ids.platos.A}/ingredientes`)
      .set("Authorization", `Bearer ${auth.owner}`)
      .send({
        items: [
          {
            id: ids.ingredientes.principal,
            cantidadReferencia: 100,
            unidadReferencia: "g",
          },
        ],
      });
    expect(setIngredientes.status).toBe(200);

    const setAlergenos = await api
      .put(`/api/v1/menu/platos/${ids.platos.A}/alergenos`)
      .set("Authorization", `Bearer ${auth.owner}`)
      .send({
        items: [{ id: ids.alergenos.principal, tipoPresencia: "CONTIENE" }],
      });
    expect(setAlergenos.status).toBe(200);

    const setCar = await api
      .put(`/api/v1/menu/platos/${ids.platos.A}/caracteristicas-alimentarias`)
      .set("Authorization", `Bearer ${auth.owner}`)
      .send({
        items: [
          { id: ids.caracteristicas.principal, estadoValidacion: "CONFIRMADO" },
        ],
      });
    expect(setCar.status).toBe(200);

    const relaciones = await api
      .get(`/api/v1/menu/platos/${ids.platos.A}/relaciones`)
      .set("Authorization", `Bearer ${auth.lector}`);
    expect(relaciones.status).toBe(200);
    expect(Object.keys(relaciones.body.datos).sort()).toEqual([
      "alergenos",
      "caracteristicas-alimentarias",
      "categorias",
      "etiquetas",
      "ingredientes",
      "proteinas",
    ]);
  });

  test("filtros combinados, paginacion, archivados y orden seguro", async () => {
    const creaFiltros = async (
      codigo,
      nombre,
      marcaId,
      tipo,
      favorito = false,
    ) => {
      const res = await api
        .post("/api/v1/menu/platos")
        .set("Authorization", `Bearer ${auth.owner}`)
        .send({ marcaId, tipo, codigo, nombre, favorito, estado: "ACTIVO" });
      expect(res.status).toBe(201);
      return res.body.datos.id;
    };

    const p1 = await creaFiltros(
      "ET2B_F1",
      "Filtro Uno",
      ids.marcaPrincipal,
      "PREPARACION",
      true,
    );
    const p2 = await creaFiltros(
      "ET2B_F2",
      "Filtro Dos",
      ids.marcaPrincipal,
      "PREPARACION",
      false,
    );
    const p3 = await creaFiltros(
      "ET2B_F3",
      "Filtro Tres",
      ids.marcaSecundaria,
      "GUARNICION",
      true,
    );

    await api
      .put(`/api/v1/menu/platos/${p1}/relaciones/categorias`)
      .set("Authorization", `Bearer ${auth.owner}`)
      .send({ ids: [ids.categorias.principal] });
    await api
      .put(`/api/v1/menu/platos/${p1}/relaciones/proteinas`)
      .set("Authorization", `Bearer ${auth.owner}`)
      .send({ ids: [ids.proteinas.principal] });

    const f1 = await api
      .get(
        `/api/v1/menu/platos?marcaId=${ids.marcaPrincipal}&tipo=PREPARACION&estado=ACTIVO`,
      )
      .set("Authorization", `Bearer ${auth.lector}`);
    expect(f1.status).toBe(200);
    expect(f1.body.meta.total).toBeGreaterThanOrEqual(2);

    const f2 = await api
      .get(
        `/api/v1/menu/platos?marcaId=${ids.marcaPrincipal}&categoriaId=${ids.categorias.principal}`,
      )
      .set("Authorization", `Bearer ${auth.lector}`);
    expect(f2.status).toBe(200);
    expect(f2.body.datos.some((item) => item.id === p1)).toBe(true);

    const f3 = await api
      .get(
        `/api/v1/menu/platos?marcaId=${ids.marcaPrincipal}&proteinaId=${ids.proteinas.principal}`,
      )
      .set("Authorization", `Bearer ${auth.lector}`);
    expect(f3.status).toBe(200);
    expect(f3.body.datos.some((item) => item.id === p1)).toBe(true);

    const f4 = await api
      .get("/api/v1/menu/platos?favorito=true&estado=ACTIVO")
      .set("Authorization", `Bearer ${auth.lector}`);
    expect(f4.status).toBe(200);
    expect(f4.body.datos.some((item) => item.id === p1)).toBe(true);

    const f5 = await api
      .get("/api/v1/menu/platos?buscar=filtro&tipo=PREPARACION")
      .set("Authorization", `Bearer ${auth.lector}`);
    expect(f5.status).toBe(200);

    const pag = await api
      .get("/api/v1/menu/platos?pagina=1&tamano=1&sortBy=nombre&sortDir=asc")
      .set("Authorization", `Bearer ${auth.lector}`);
    expect(pag.status).toBe(200);
    expect(pag.body.meta.tamano).toBe(1);

    const invalidoOrden = await api
      .get("/api/v1/menu/platos?sortBy=invalido")
      .set("Authorization", `Bearer ${auth.lector}`);
    expect(invalidoOrden.status).toBe(400);

    const archivar = await api
      .patch(`/api/v1/menu/platos/${p2}/estado`)
      .set("Authorization", `Bearer ${auth.owner}`)
      .send({ estado: "ARCHIVADO" });
    expect(archivar.status).toBe(200);

    const defaultSinArchivados = await api
      .get("/api/v1/menu/platos?buscar=filtro")
      .set("Authorization", `Bearer ${auth.lector}`);
    expect(defaultSinArchivados.status).toBe(200);
    expect(defaultSinArchivados.body.datos.some((item) => item.id === p2)).toBe(
      false,
    );

    const conArchivados = await api
      .get("/api/v1/menu/platos?buscar=filtro&includeArchivados=true")
      .set("Authorization", `Bearer ${auth.lector}`);
    expect(conArchivados.status).toBe(200);
    expect(conArchivados.body.datos.some((item) => item.id === p2)).toBe(true);

    const idsUnicos = new Set(conArchivados.body.datos.map((item) => item.id));
    expect(idsUnicos.size).toBe(conArchivados.body.datos.length);

    void p3;
  }, 120000);
});
