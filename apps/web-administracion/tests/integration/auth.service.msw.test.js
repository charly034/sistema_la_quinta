// @vitest-environment node
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  cerrarSesion,
  iniciarSesion,
  obtenerMiPerfil,
  renovarSesion,
} from "../../src/services/auth.service";

const API = (
  import.meta.env?.VITE_API_URL || "http://localhost:3000/api/v1"
).replace(/\/$/, "");

const server = setupServer(
  http.post(`${API}/autenticacion/iniciar-sesion`, async () => {
    return HttpResponse.json({
      data: {
        accessToken: "access-test",
        refreshToken: "refresh-test",
        usuario: { id: "u1", nombre: "Admin", permisos: ["MENUS_LEER"] },
      },
    });
  }),
  http.get(`${API}/autenticacion/mi-perfil`, async () => {
    return HttpResponse.json({
      data: { id: "u1", nombre: "Admin", permisos: ["MENUS_LEER"] },
    });
  }),
  http.post(`${API}/autenticacion/renovar-sesion`, async () => {
    return HttpResponse.json({
      data: {
        accessToken: "nuevo-access",
        refreshToken: "nuevo-refresh",
        usuario: { id: "u1", nombre: "Admin", permisos: ["MENUS_LEER"] },
      },
    });
  }),
  http.post(`${API}/autenticacion/cerrar-sesion`, async () => {
    return HttpResponse.json({ data: { cerrado: true } });
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("auth.service con MSW", () => {
  it("login", async () => {
    const out = await iniciarSesion({
      correo: "admin@local.test",
      contrasena: "Password123",
    });
    expect(out.accessToken).toBe("access-test");
    expect(out.refreshToken).toBe("refresh-test");
  });

  it("recuperación de perfil", async () => {
    const out = await obtenerMiPerfil();
    expect(out.id).toBe("u1");
    expect(out.permisos).toContain("MENUS_LEER");
  });

  it("refresh de sesión", async () => {
    const out = await renovarSesion("refresh-test");
    expect(out.accessToken).toBe("nuevo-access");
    expect(out.refreshToken).toBe("nuevo-refresh");
  });

  it("cierre de sesión", async () => {
    const out = await cerrarSesion("refresh-test");
    expect(out.cerrado).toBe(true);
  });
});
