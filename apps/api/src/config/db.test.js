import { describe, expect, test, beforeEach, afterEach } from "@jest/globals";
import { crearConfiguracionDb } from "./db.js";

describe("configuracion db", () => {
  const envAnterior = { ...process.env };

  beforeEach(() => {
    process.env = { ...envAnterior };
  });

  afterEach(() => {
    process.env = { ...envAnterior };
  });

  test("usa valores por defecto seguros ante configuracion invalida", () => {
    process.env.NODE_ENV = "development";
    process.env.DB_PORT = "abc";
    process.env.DB_SSL = "nope";
    process.env.DB_HOST = "localhost";
    process.env.DB_FORCE_LOCAL = "1";

    const configuracion = crearConfiguracionDb();

    expect(configuracion.config.port).toBe(5432);
    expect(configuracion.config.ssl).toBe(false);
    expect(configuracion.usarRemota).toBe(false);
  });
});
