import { describe, expect, test } from "@jest/globals";
import { sanitizarDatosAuditoria } from "./auditoria.utilidades.js";

describe("auditoria.utilidades", () => {
  test("elimina campos sensibles de forma recursiva", () => {
    const resultado = sanitizarDatosAuditoria({
      nombre: "La Quinta",
      hash_contrasena: "secreto",
      credenciales: {
        token: "abc",
        visible: true,
        hijos: [{ password: "123", ok: 1 }],
      },
    });

    expect(resultado).toEqual({
      nombre: "La Quinta",
      credenciales: {
        visible: true,
        hijos: [{ ok: 1 }],
      },
    });
  });
});
