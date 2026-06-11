import { describe, expect, test } from "@jest/globals";
import { validarDatabaseUrlPruebasSegura } from "./etapa3g.utils.js";

describe("ETAPA4 Integracion - Guardrail DATABASE_URL_PRUEBAS", () => {
  test("rechaza ejecucion sin DATABASE_URL_PRUEBAS", () => {
    expect(() => validarDatabaseUrlPruebasSegura("")).toThrow(
      /DATABASE_URL_PRUEBAS es obligatoria/i,
    );
  });

  test("acepta base de pruebas y anti-produccion aprobada", () => {
    const out = validarDatabaseUrlPruebasSegura(
      "postgres://user:pass@localhost:5432/la_quinta_pruebas",
    );
    expect(out.base).toBe("la_quinta_pruebas");
    expect(out.anti_produccion).toBe("APROBADA");
  });

  test("rechaza nombres/hosts que parezcan produccion", () => {
    expect(() =>
      validarDatabaseUrlPruebasSegura(
        "postgres://user:pass@prod-db.internal:5432/la_quinta_pruebas",
      ),
    ).toThrow(/anti-producci/i);
  });
});
