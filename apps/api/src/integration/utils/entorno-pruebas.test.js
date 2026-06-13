import path from "node:path";
import os from "node:os";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { describe, test, expect } from "@jest/globals";
import {
  API_ROOT,
  cargarEntornoPruebas,
  obtenerUrlPruebas,
  validarBasePruebas,
} from "./entorno-pruebas.js";

function crearArchivoEnvTemporal(contenido) {
  const dir = mkdtempSync(path.join(os.tmpdir(), "entorno-pruebas-"));
  const rutaEnv = path.join(dir, ".env");
  writeFileSync(rutaEnv, contenido, "utf8");
  return {
    rutaEnv,
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}

describe("utilidad entorno-pruebas", () => {
  test("ruta de .env apunta a apps/api/.env", () => {
    const rutaEnvApi = path.resolve(API_ROOT, ".env");
    expect(path.basename(rutaEnvApi)).toBe(".env");
    expect(path.basename(path.dirname(rutaEnvApi))).toBe("api");
  });

  test("variable ya definida: no la reemplaza", () => {
    const { rutaEnv, cleanup } = crearArchivoEnvTemporal(
      "DATABASE_URL_PRUEBAS=postgres://localhost:5433/otra_base_test\n",
    );
    const env = {
      DATABASE_URL_PRUEBAS: "postgres://localhost:5433/base_predefinida_test",
    };

    try {
      cargarEntornoPruebas({ env, rutaEnv });
      expect(env.DATABASE_URL_PRUEBAS).toBe(
        "postgres://localhost:5433/base_predefinida_test",
      );
    } finally {
      cleanup();
    }
  });

  test("variable ausente y apps/api/.env existente: carga DATABASE_URL_PRUEBAS", () => {
    const { rutaEnv, cleanup } = crearArchivoEnvTemporal(
      "DATABASE_URL_PRUEBAS=postgres://localhost:5433/la_quinta_pruebas\n",
    );
    const env = {};

    try {
      cargarEntornoPruebas({ env, rutaEnv });
      expect(env.DATABASE_URL_PRUEBAS).toBe(
        "postgres://localhost:5433/la_quinta_pruebas",
      );
    } finally {
      cleanup();
    }
  });

  test("variable ausente y archivo inexistente: error claro", () => {
    const env = {};
    expect(() =>
      cargarEntornoPruebas({
        env,
        rutaEnv: path.join(os.tmpdir(), `no-existe-${Date.now()}.env`),
      }),
    ).toThrow(/DATABASE_URL_PRUEBAS es obligatoria/i);
  });

  test("base de pruebas: aceptada", () => {
    const resultado = validarBasePruebas(
      "postgres://localhost:5433/la_quinta_pruebas",
    );
    expect(resultado.base).toBe("la_quinta_pruebas");
    expect(resultado.host).toBe("localhost");
    expect(resultado.puerto).toBe("5433");
    expect(resultado.anti_produccion).toBe("APROBADA");
  });

  test("base productiva: rechazada", () => {
    expect(() =>
      validarBasePruebas("postgres://localhost:5432/la_quinta_testing_prod"),
    ).toThrow(/anti-producción/i);
  });

  test("DATABASE_URL definida sin DATABASE_URL_PRUEBAS: rechazada", () => {
    const env = {
      DATABASE_URL: "postgres://localhost:5432/no_aceptada",
    };
    expect(() =>
      obtenerUrlPruebas({
        env,
        rutaEnv: path.join(os.tmpdir(), `sin-db-pruebas-${Date.now()}.env`),
      }),
    ).toThrow(/No se aceptan fallback DATABASE_URL\/DB_\*/i);
  });

  test("ejecución desde raíz del repositorio", () => {
    const repoRoot = path.resolve(API_ROOT, "..", "..");
    const original = process.cwd();

    const { rutaEnv, cleanup } = crearArchivoEnvTemporal(
      "DATABASE_URL_PRUEBAS=postgres://localhost:5433/raiz_test\n",
    );
    const env = {};

    try {
      process.chdir(repoRoot);
      cargarEntornoPruebas({ env, rutaEnv });
      expect(env.DATABASE_URL_PRUEBAS).toContain("raiz_test");
    } finally {
      process.chdir(original);
      cleanup();
    }
  });

  test("ejecución desde apps/api", () => {
    const original = process.cwd();
    const { rutaEnv, cleanup } = crearArchivoEnvTemporal(
      "DATABASE_URL_PRUEBAS=postgres://localhost:5433/api_test\n",
    );
    const env = {};

    try {
      process.chdir(API_ROOT);
      cargarEntornoPruebas({ env, rutaEnv });
      expect(env.DATABASE_URL_PRUEBAS).toContain("api_test");
    } finally {
      process.chdir(original);
      cleanup();
    }
  });
});
