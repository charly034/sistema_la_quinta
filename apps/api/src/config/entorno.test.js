import { describe, expect, test, beforeEach, afterEach } from "@jest/globals";
import { obtenerConfiguracionAplicacion } from "./entorno.js";

describe("entorno", () => {
  const envAnterior = { ...process.env };

  beforeEach(() => {
    process.env = { ...envAnterior };
  });

  afterEach(() => {
    process.env = { ...envAnterior };
  });

  test("convierte valores numericos y booleanos con fallback seguro", () => {
    process.env.PORT = "not-a-number";
    process.env.COSTO_HASH_CONTRASENA = "abc";
    process.env.RATE_LIMIT_AUTENTICACION_VENTANA_MS = "";
    process.env.RATE_LIMIT_AUTENTICACION_MAXIMO = "0";
    process.env.AUDITORIA_HABILITADA = "false";

    const configuracion = obtenerConfiguracionAplicacion();

    expect(configuracion.puerto).toBe(3000);
    expect(configuracion.costoHashContrasena).toBe(12);
    expect(configuracion.rateLimitAutenticacionVentanaMs).toBe(60000);
    expect(configuracion.rateLimitAutenticacionMaximo).toBe(10);
    expect(configuracion.auditoriaHabilitada).toBe(false);
  });
});
