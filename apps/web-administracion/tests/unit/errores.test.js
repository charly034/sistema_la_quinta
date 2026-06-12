import test from "node:test";
import assert from "node:assert/strict";
import { normalizarError } from "../../src/utils/errores.js";

test("mapea codigo de dominio conocido", () => {
  const error = {
    response: {
      status: 409,
      data: { error: { code: "PROPUESTA_DESACTUALIZADA" } },
    },
  };
  const out = normalizarError(error);
  assert.equal(out.message.includes("El menú fue modificado"), true);
});

test("mapea 401", () => {
  const error = { response: { status: 401, data: {} } };
  const out = normalizarError(error);
  assert.equal(out.message.includes("sesión venció"), true);
});
