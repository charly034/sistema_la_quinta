import { describe, expect, test } from "@jest/globals";
import {
  normalizarTextoBusqueda,
  normalizarDireccionOrden,
} from "../platos.utilidades.js";

describe("platos.utilidades", () => {
  test("normaliza texto para busqueda sin tildes", () => {
    expect(normalizarTextoBusqueda("  Ñoquis de Papá  ")).toBe(
      "noquis de papa",
    );
  });

  test("ordena direccion con fallback asc", () => {
    expect(normalizarDireccionOrden("desc")).toBe("DESC");
    expect(normalizarDireccionOrden("otro")).toBe("ASC");
  });
});
