import { describe, expect, test, jest, beforeEach } from "@jest/globals";

const verificarTokenAcceso = jest.fn();
const obtenerSesionActivaPorId = jest.fn();
const obtenerUsuarioConPermisosPorId = jest.fn();

jest.unstable_mockModule(
  "../modules/autenticacion/autenticacion.utilidades.js",
  () => ({
    verificarTokenAcceso,
  }),
);

jest.unstable_mockModule(
  "../modules/autenticacion/autenticacion.repositorio.js",
  () => ({
    obtenerSesionActivaPorId,
    obtenerUsuarioConPermisosPorId,
  }),
);

const { autenticar, requierePermiso } =
  await import("./autenticacion.middleware.js");

describe("autenticacion.middleware", () => {
  beforeEach(() => {
    verificarTokenAcceso.mockReset();
    obtenerSesionActivaPorId.mockReset();
    obtenerUsuarioConPermisosPorId.mockReset();
  });

  test("requiere permiso cuando el usuario no tiene el codigo", async () => {
    const next = jest.fn();
    const middleware = requierePermiso("USUARIOS_LEER");

    await middleware({ usuario: { permisos: [] } }, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].codigo).toBe("PERMISO_INSUFICIENTE");
  });

  test("requiere permiso cuando el usuario lo tiene", async () => {
    const next = jest.fn();
    const middleware = requierePermiso("USUARIOS_LEER");

    await middleware({ usuario: { permisos: ["USUARIOS_LEER"] } }, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0]).toHaveLength(0);
  });

  test("autenticar rechaza solicitudes sin token", async () => {
    const next = jest.fn();

    await autenticar({ headers: {} }, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].codigo).toBe("TOKEN_INVALIDO");
  });

  test("autenticar construye usuario autenticado cuando el token es valido", async () => {
    verificarTokenAcceso.mockReturnValue({
      sesionId: "sesion-1",
      sub: "usuario-1",
    });
    obtenerSesionActivaPorId.mockResolvedValue({ id: "sesion-1" });
    obtenerUsuarioConPermisosPorId.mockResolvedValue({
      id: "usuario-1",
      correo: "usuario@ejemplo.com",
      nombre: "Usuario",
      estado: "ACTIVO",
      roles: [],
      permisos: ["USUARIOS_LEER"],
    });

    const req = { headers: { authorization: "Bearer token" } };
    const next = jest.fn();

    await autenticar(req, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0]).toHaveLength(0);
    expect(req.usuario).toMatchObject({
      id: "usuario-1",
      correo: "usuario@ejemplo.com",
      nombre: "Usuario",
      estado: "ACTIVO",
      sesionId: "sesion-1",
    });
  });
});
