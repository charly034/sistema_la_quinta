import { beforeAll, afterAll, describe, expect, test } from "@jest/globals";
import { execSync } from "child_process";
import { randomUUID } from "node:crypto";
import request from "supertest";
import {
  API_ROOT,
  obtenerUrlPruebas,
  validarBasePruebas,
} from "./utils/entorno-pruebas.js";

const ROOT_API = API_ROOT;

function cargarDatabaseUrlPruebas() {
  return obtenerUrlPruebas();
}

function prepararEntornoPruebas() {
  const dbPruebas = cargarDatabaseUrlPruebas();
  validarBasePruebas(dbPruebas);
  process.env.DATABASE_URL_PRUEBAS = dbPruebas;
  process.env.JWT_SECRETO_ACCESO = "etapa1c-secreto-pruebas";
  process.env.NODE_ENV = "test";
  process.env.RATE_LIMIT_AUTENTICACION_MAXIMO = "200";
  process.env.RATE_LIMIT_AUTENTICACION_VENTANA_MS = "60000";

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
      RESET_DB_CONFIRMACION: "RESET_DB_PRUEBAS",
    },
  });
}

let app;
let api;
let createApp;
let initDb;
let closeDb;
let ownerAccessToken;
let ownerRefreshToken;
let ownerUserId;
let marcaTestId;
let canalTestId;
let empresaTestId;
let opcionTestId;
let opcion2TestId;
let userSinPermisosCorreo;

async function login(correo, contrasena) {
  return api
    .post("/api/v1/autenticacion/iniciar-sesion")
    .send({ correo, contrasena });
}

describe("Etapa 1C integración real", () => {
  beforeAll(async () => {
    prepararEntornoPruebas();

    const dbModule = await import("../config/db.js");
    initDb = dbModule.initDb;
    closeDb = dbModule.closeDb;

    const appModule = await import("../app.js");
    createApp = appModule.createApp;

    ejecutarComando("node ./scripts/reset-db-pruebas.cjs");
    ejecutarComando("npm run migrar:subir");

    process.env.CORREO_PROPETARIO = "propietario.pruebas@laquinta.local";
    process.env.CONTRASENA_PROPETARIO = "TmpPrueba1234";
    process.env.NOMBRE_PROPETARIO = "Propietario Pruebas";
    ejecutarComando("node ./scripts/crear-propietario.js");

    await initDb();
    app = createApp();
    api = request(app);
  }, 120000);

  afterAll(async () => {
    if (closeDb) {
      await closeDb();
    }
  });

  test("login correcto", async () => {
    const res = await login(
      "propietario.pruebas@laquinta.local",
      "TmpPrueba1234",
    );
    expect(res.status).toBe(200);
    expect(res.body?.datos?.accessToken).toBeTruthy();
    expect(res.body?.datos?.refreshToken).toBeTruthy();
    ownerAccessToken = res.body.datos.accessToken;
    ownerRefreshToken = res.body.datos.refreshToken;
    ownerUserId = res.body.datos.usuario.id;
  });

  test("login incorrecto", async () => {
    const res = await login(
      "propietario.pruebas@laquinta.local",
      "ClaveInvalida123",
    );
    expect(res.status).toBe(401);
  });

  test("perfil sin token", async () => {
    const res = await api.get("/api/v1/autenticacion/mi-perfil");
    expect(res.status).toBe(401);
  });

  test("perfil autenticado", async () => {
    const res = await api
      .get("/api/v1/autenticacion/mi-perfil")
      .set("Authorization", `Bearer ${ownerAccessToken}`);
    expect(res.status).toBe(200);
    expect(res.body?.datos?.correo).toBe("propietario.pruebas@laquinta.local");
  });

  test("crear usuario inactivo y bloquear su login", async () => {
    const correo = "inactivo.pruebas@laquinta.local";
    const crear = await api
      .post("/api/v1/usuarios")
      .set("Authorization", `Bearer ${ownerAccessToken}`)
      .send({
        correo,
        contrasena: "Inactivo1234",
        nombre: "Usuario Inactivo",
        estado: "INACTIVO",
      });

    expect(crear.status).toBe(201);

    const loginInactivo = await login(correo, "Inactivo1234");
    expect(loginInactivo.status).toBe(401);
  });

  test("rotación de refresh token y rechazo de reutilización", async () => {
    const renovar = await api
      .post("/api/v1/autenticacion/renovar-sesion")
      .send({ refreshToken: ownerRefreshToken });

    expect(renovar.status).toBe(200);
    const refreshNuevo = renovar.body?.datos?.refreshToken;
    expect(refreshNuevo).toBeTruthy();

    const reuso = await api
      .post("/api/v1/autenticacion/renovar-sesion")
      .send({ refreshToken: ownerRefreshToken });

    expect(reuso.status).toBe(401);
    ownerRefreshToken = refreshNuevo;
    ownerAccessToken = renovar.body?.datos?.accessToken;
  });

  test("acceso sin permiso", async () => {
    userSinPermisosCorreo = `cliente.sin.permisos.${randomUUID().slice(0, 8)}@laquinta.local`;

    const crearUsuario = await api
      .post("/api/v1/usuarios")
      .set("Authorization", `Bearer ${ownerAccessToken}`)
      .send({
        correo: userSinPermisosCorreo,
        contrasena: "Cliente1234",
        nombre: "Cliente Sin Permisos",
      });

    expect(crearUsuario.status).toBe(201);

    const asignarRol = await api
      .put(`/api/v1/usuarios/${crearUsuario.body.datos.id}/roles`)
      .set("Authorization", `Bearer ${ownerAccessToken}`)
      .send({ roles: ["CLIENTE"] });

    expect(asignarRol.status).toBe(200);

    const loginCliente = await login(userSinPermisosCorreo, "Cliente1234");
    expect(loginCliente.status).toBe(200);

    const sinPermiso = await api
      .get("/api/v1/marcas")
      .set("Authorization", `Bearer ${loginCliente.body.datos.accessToken}`);

    expect(sinPermiso.status).toBe(403);
  }, 20000);

  test("acceso con permiso", async () => {
    const conPermiso = await api
      .get("/api/v1/marcas")
      .set("Authorization", `Bearer ${ownerAccessToken}`);

    expect(conPermiso.status).toBe(200);
  });

  test("creación y edición de marca", async () => {
    const crear = await api
      .post("/api/v1/marcas")
      .set("Authorization", `Bearer ${ownerAccessToken}`)
      .send({ codigo: "E1C_MARCA", nombre: "Marca E1C" });

    expect(crear.status).toBe(201);
    marcaTestId = crear.body.datos.id;

    const editar = await api
      .patch(`/api/v1/marcas/${marcaTestId}`)
      .set("Authorization", `Bearer ${ownerAccessToken}`)
      .send({ nombre: "Marca E1C Editada" });

    expect(editar.status).toBe(200);
  });

  test("código de marca duplicado", async () => {
    const dup = await api
      .post("/api/v1/marcas")
      .set("Authorization", `Bearer ${ownerAccessToken}`)
      .send({ codigo: "E1C_MARCA", nombre: "Marca Duplicada" });

    expect(dup.status).toBe(409);
  });

  test("creación y edición de canal", async () => {
    const crear = await api
      .post("/api/v1/canales")
      .set("Authorization", `Bearer ${ownerAccessToken}`)
      .send({ codigo: "E1C_CANAL", nombre: "Canal E1C" });

    expect(crear.status).toBe(201);
    canalTestId = crear.body.datos.id;

    const editar = await api
      .patch(`/api/v1/canales/${canalTestId}`)
      .set("Authorization", `Bearer ${ownerAccessToken}`)
      .send({ nombre: "Canal E1C Editado" });

    expect(editar.status).toBe(200);
  });

  test("creación y edición de empresa", async () => {
    const crear = await api
      .post("/api/v1/empresas")
      .set("Authorization", `Bearer ${ownerAccessToken}`)
      .send({ codigo: "E1C_EMPRESA", nombre: "Empresa E1C" });

    expect(crear.status).toBe(201);
    empresaTestId = crear.body.datos.id;

    const editar = await api
      .patch(`/api/v1/empresas/${empresaTestId}`)
      .set("Authorization", `Bearer ${ownerAccessToken}`)
      .send({ nombre: "Empresa E1C Editada" });

    expect(editar.status).toBe(200);
  });

  test("asociación empresa-marca", async () => {
    const asociar = await api
      .put(`/api/v1/empresas/${empresaTestId}/marcas`)
      .set("Authorization", `Bearer ${ownerAccessToken}`)
      .send({ marcas: [marcaTestId] });

    expect(asociar.status).toBe(200);
  });

  test("creación de opción de menú", async () => {
    const crear = await api
      .post("/api/v1/menu/opciones")
      .set("Authorization", `Bearer ${ownerAccessToken}`)
      .send({
        marcaId: marcaTestId,
        codigo: "E1C_A",
        nombre: "Opción E1C A",
        orden: 0,
      });

    expect(crear.status).toBe(201);
    opcionTestId = crear.body.datos.id;

    const crear2 = await api
      .post("/api/v1/menu/opciones")
      .set("Authorization", `Bearer ${ownerAccessToken}`)
      .send({
        marcaId: marcaTestId,
        codigo: "E1C_B",
        nombre: "Opción E1C B",
        orden: 1,
      });

    expect(crear2.status).toBe(201);
    opcion2TestId = crear2.body.datos.id;
  });

  test("código de opción duplicado por marca", async () => {
    const dup = await api
      .post("/api/v1/menu/opciones")
      .set("Authorization", `Bearer ${ownerAccessToken}`)
      .send({ marcaId: marcaTestId, codigo: "E1C_A", nombre: "Duplicada" });

    expect(dup.status).toBe(409);
  });

  test("reordenamiento de opciones", async () => {
    const reordenar = await api
      .put("/api/v1/menu/opciones/reordenar")
      .set("Authorization", `Bearer ${ownerAccessToken}`)
      .send({
        marcaId: marcaTestId,
        opciones: [
          { id: opcionTestId, orden: 1 },
          { id: opcion2TestId, orden: 0 },
        ],
      });

    expect(reordenar.status).toBe(200);
  });

  test("rollback de reordenamiento ante error", async () => {
    const previo = await api
      .get("/api/v1/menu/opciones?marca=E1C_MARCA")
      .set("Authorization", `Bearer ${ownerAccessToken}`);

    const reordenarInvalido = await api
      .put("/api/v1/menu/opciones/reordenar")
      .set("Authorization", `Bearer ${ownerAccessToken}`)
      .send({
        marcaId: marcaTestId,
        opciones: [
          { id: opcionTestId, orden: 2 },
          { id: "00000000-0000-0000-0000-000000000000", orden: 0 },
        ],
      });

    expect(reordenarInvalido.status).toBe(409);

    const posterior = await api
      .get("/api/v1/menu/opciones?marca=E1C_MARCA")
      .set("Authorization", `Bearer ${ownerAccessToken}`);

    expect(posterior.status).toBe(200);
    expect(posterior.body.datos).toEqual(previo.body.datos);
  });

  test("logout y token de refresh invalidado", async () => {
    const loginActual = await login(
      "propietario.pruebas@laquinta.local",
      "TmpPrueba1234",
    );
    expect(loginActual.status).toBe(200);

    const renovar = await api
      .post("/api/v1/autenticacion/renovar-sesion")
      .send({ refreshToken: loginActual.body.datos.refreshToken });

    expect(renovar.status).toBe(200);
    const refresh = renovar.body?.datos?.refreshToken;

    const logout = await api
      .post("/api/v1/autenticacion/cerrar-sesion")
      .send({ refreshToken: refresh });

    expect(logout.status).toBe(200);

    const reuso = await api
      .post("/api/v1/autenticacion/renovar-sesion")
      .send({ refreshToken: refresh });

    expect(reuso.status).toBe(401);

    ownerAccessToken = renovar.body?.datos?.accessToken;
  });

  test("cambio de contraseña y revocación de sesiones", async () => {
    api = request(createApp());

    const loginAntes = await login(
      "propietario.pruebas@laquinta.local",
      "TmpPrueba1234",
    );
    expect(loginAntes.status).toBe(200);
    const refreshAnterior = loginAntes.body.datos.refreshToken;

    const cambiar = await api
      .post("/api/v1/autenticacion/cambiar-contrasena")
      .set("Authorization", `Bearer ${loginAntes.body.datos.accessToken}`)
      .send({
        contrasenaActual: "TmpPrueba1234",
        nuevaContrasena: "TmpPrueba5678",
      });

    expect(cambiar.status).toBe(200);

    const renovarViejo = await api
      .post("/api/v1/autenticacion/renovar-sesion")
      .send({ refreshToken: refreshAnterior });

    expect([401, 429]).toContain(renovarViejo.status);

    const loginNuevo = await login(
      "propietario.pruebas@laquinta.local",
      "TmpPrueba5678",
    );
    expect(loginNuevo.status).toBe(200);

    const volver = await api
      .post("/api/v1/autenticacion/cambiar-contrasena")
      .set("Authorization", `Bearer ${loginNuevo.body.datos.accessToken}`)
      .send({
        contrasenaActual: "TmpPrueba5678",
        nuevaContrasena: "TmpPrueba1234",
      });

    expect(volver.status).toBe(200);

    const loginOriginal = await login(
      "propietario.pruebas@laquinta.local",
      "TmpPrueba1234",
    );
    expect(loginOriginal.status).toBe(200);
    ownerAccessToken = loginOriginal.body.datos.accessToken;
    ownerRefreshToken = loginOriginal.body.datos.refreshToken;
  }, 30000);

  test("auditoría sin secretos", async () => {
    const res = await api
      .get("/api/v1/auditoria")
      .set("Authorization", `Bearer ${ownerAccessToken}`);

    expect(res.status).toBe(200);
    const contenido = JSON.stringify(res.body);
    expect(contenido.toLowerCase()).not.toContain("hash_token");
    expect(contenido.toLowerCase()).not.toContain("refresh_token");
    expect(contenido.toLowerCase()).not.toContain("access_token");
    expect(contenido).not.toContain("TmpPrueba1234");
    expect(contenido).not.toContain("TmpPrueba5678");
  });

  test("endpoint setup inexistente y legacy montado", async () => {
    const setup = await api.post("/api/v1/pedidos/setup");
    expect(setup.status).toBe(404);

    const legacy = await api.get("/api/v1/pedidos");
    expect(legacy.status).toBe(200);
  });
});
