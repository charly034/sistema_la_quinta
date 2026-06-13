import { describe, expect, it } from "vitest";
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

describe("permisos", () => {
  it("valida permiso simple", () => {
    expect(tienePermiso(usuario, "MENUS_GESTIONAR")).toBe(true);
    expect(tienePermiso(usuario, "MENUS_PUBLICAR")).toBe(false);
  });

  it("valida alguno de varios permisos", () => {
    expect(tieneAlgunoDeLosPermisos(usuario, ["X", "REGLAS_GESTIONAR"])).toBe(
      true,
    );
  });

  it("expone helpers de dominio", () => {
    expect(puedeGestionarMenus(usuario)).toBe(true);
    expect(puedePublicarMenus(usuario)).toBe(false);
    expect(puedeGestionarReglas(usuario)).toBe(true);
    expect(puedeAplicarPropuestas(usuario)).toBe(true);
  });
});
