import test from "node:test";
import assert from "node:assert/strict";
import { obtenerNombreDescarga } from "../../src/utils/archivos.js";

test("usa filename utf8", () => {
  const headers = {
    "content-disposition": "attachment; filename*=UTF-8''menu%20semana.xlsx",
  };
  assert.equal(
    obtenerNombreDescarga(headers, "fallback.xlsx"),
    "menu semana.xlsx",
  );
});

test("usa fallback seguro", () => {
  assert.equal(obtenerNombreDescarga({}, "fallback.xlsx"), "fallback.xlsx");
});
