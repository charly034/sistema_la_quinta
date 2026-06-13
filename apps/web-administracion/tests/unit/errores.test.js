import { describe, expect, it } from "vitest";
import { normalizarError } from "../../src/utils/errores.js";

describe("errores", () => {
  it("mapea codigo de dominio conocido", () => {
    const error = {
      response: {
        status: 409,
        data: { error: { code: "PROPUESTA_DESACTUALIZADA" } },
      },
    };
    const out = normalizarError(error);
    expect(out.message.includes("El menú fue modificado")).toBe(true);
  });

  it("mapea 401", () => {
    const error = { response: { status: 401, data: {} } };
    const out = normalizarError(error);
    expect(out.message.includes("sesión venció")).toBe(true);
  });

  it("mapea 403", () => {
    const error = { response: { status: 403, data: {} } };
    const out = normalizarError(error);
    expect(out.message.includes("No tenés permisos")).toBe(true);
  });

  it("mapea 409 genérico", () => {
    const error = { response: { status: 409, data: {} } };
    const out = normalizarError(error);
    expect(out.message.includes("conflicto")).toBe(true);
  });

  it("mapea POSICION_BLOQUEADA_CONFLICTIVA", () => {
    const error = {
      response: {
        status: 409,
        data: { error: { code: "POSICION_BLOQUEADA_CONFLICTIVA" } },
      },
    };
    const out = normalizarError(error);
    expect(out.message.includes("bloqueadas conflictivas")).toBe(true);
  });
});
