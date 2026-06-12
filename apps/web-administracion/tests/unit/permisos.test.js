import test from "node:test";
import assert from "node:assert/strict";
import {
  tienePermiso,
  tieneAlgunoDeLosPermisos,
  puedeAplicarPropuestas,
  puedeGestionarMenus,
  puedeGestionarReglas,
  puedePublicarMenus,
} from "../../src/utils/permisos.js";

const usuario = {
  permisos: ["MENUS_GESTIONAR", "REGLAS_GESTIONAR", "PROPUESTAS_APLICAR"],
};

test("valida permiso simple", () => {
  assert.equal(tienePermiso(usuario, "MENUS_GESTIONAR"), true);
  assert.equal(tienePermiso(usuario, "MENUS_PUBLICAR"), false);
});

test("valida alguno de varios permisos", () => {
  assert.equal(
    tieneAlgunoDeLosPermisos(usuario, ["X", "REGLAS_GESTIONAR"]),
    true,
  );
});

test("expone helpers de dominio", () => {
  assert.equal(puedeGestionarMenus(usuario), true);
  assert.equal(puedePublicarMenus(usuario), false);
  assert.equal(puedeGestionarReglas(usuario), true);
  assert.equal(puedeAplicarPropuestas(usuario), true);
});
