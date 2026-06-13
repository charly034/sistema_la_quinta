import { describe, expect, test } from "vitest";
import {
  obtenerJwtSecretoE2E,
  validarDatabaseUrlPruebas,
} from "../../e2e/setup/e2e-env.mjs";

describe("entorno E2E", () => {
  test("usa un JWT de pruebas explícito cuando no hay secreto configurado", () => {
    expect(obtenerJwtSecretoE2E({})).toBe("secreto-e2e-no-productivo");
  });

  test("rechaza una base que no parece de pruebas", () => {
    expect(() =>
      validarDatabaseUrlPruebas(
        "postgresql://usuario:clave@localhost:5432/la_quinta",
      ),
    ).toThrow(/no parece de pruebas/i);
  });

  test("rechaza un host que parece de produccion", () => {
    expect(() =>
      validarDatabaseUrlPruebas(
        "postgresql://usuario:clave@prod-db.internal:5432/la_quinta_pruebas",
      ),
    ).toThrow(/anti-producción/i);
  });
});
