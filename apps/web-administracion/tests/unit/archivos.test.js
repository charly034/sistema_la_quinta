import { describe, expect, it } from "vitest";
import { obtenerNombreDescarga } from "../../src/utils/archivos.js";

describe("archivos", () => {
  it("usa filename utf8", () => {
    const headers = {
      "content-disposition": "attachment; filename*=UTF-8''menu%20semana.xlsx",
    };
    expect(obtenerNombreDescarga(headers, "fallback.xlsx")).toBe(
      "menu semana.xlsx",
    );
  });

  it("usa fallback seguro", () => {
    expect(obtenerNombreDescarga({}, "fallback.xlsx")).toBe("fallback.xlsx");
  });
});
