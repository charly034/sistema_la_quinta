import { describe, expect, test } from "@jest/globals";
import { crearConfiguracionCORS } from "./cors.js";

function evaluarOrigen(configuracion, origin) {
  return new Promise((resolve) => {
    configuracion.origin(origin, (error, permitido) => {
      resolve({ error, permitido });
    });
  });
}

describe("cors", () => {
  test("permite origenes autorizados y solicitudes sin Origin", async () => {
    const configuracion = crearConfiguracionCORS(["http://localhost:5173"]);

    await expect(evaluarOrigen(configuracion, undefined)).resolves.toEqual({
      error: null,
      permitido: true,
    });

    await expect(
      evaluarOrigen(configuracion, "http://localhost:5173"),
    ).resolves.toEqual({ error: null, permitido: true });
  });

  test("rechaza origenes no autorizados", async () => {
    const configuracion = crearConfiguracionCORS(["http://localhost:5173"]);
    const resultado = await evaluarOrigen(
      configuracion,
      "https://evil.example",
    );

    expect(resultado.error).toBeInstanceOf(Error);
    expect(resultado.permitido).toBeUndefined();
  });
});
