import { describe, expect, test, beforeEach, afterEach } from "@jest/globals";
import {
  crearRefreshToken,
  hashearRefreshToken,
  crearTokenAcceso,
  verificarTokenAcceso,
} from "./autenticacion.utilidades.js";

describe("autenticacion.utilidades", () => {
  const envAnterior = { ...process.env };

  beforeEach(() => {
    process.env.JWT_SECRETO_ACCESO = "secreto-de-prueba";
    process.env.JWT_DURACION_ACCESO = "1h";
  });

  afterEach(() => {
    process.env = { ...envAnterior };
  });

  test("genera refresh tokens opacos", () => {
    const token = crearRefreshToken();
    expect(token).toHaveLength(96);
  });

  test("hashea refresh tokens de forma estable", () => {
    expect(hashearRefreshToken("token-prueba")).toBe(
      hashearRefreshToken("token-prueba"),
    );
  });

  test("firma y verifica access tokens", () => {
    const token = crearTokenAcceso({ usuarioId: "usuario-1", sesionId: "s-1" });
    const payload = verificarTokenAcceso(token);
    expect(payload.sub).toBe("usuario-1");
    expect(payload.sesionId).toBe("s-1");
  });
});
