import { describe, expect, test } from "@jest/globals";
import {
  normalizarCorreo,
  normalizarCodigo,
  generarTokenAleatorio,
  hashTokenSeguro,
  hashContrasena,
  verificarContrasena,
  normalizarListaOrigenes,
} from "./seguridad.js";

describe("seguridad", () => {
  test("normaliza correos", () => {
    expect(normalizarCorreo("  Usuario@Ejemplo.COM  ")).toBe(
      "usuario@ejemplo.com",
    );
  });

  test("normaliza codigos", () => {
    expect(normalizarCodigo("  venta online  ")).toBe("VENTA_ONLINE");
    expect(normalizarCodigo("opción especial")).toBe("OPCI_N_ESPECIAL");
  });

  test("genera tokens aleatorios con longitud esperada", () => {
    const token = generarTokenAleatorio(16);
    expect(token).toHaveLength(32);
  });

  test("hashea tokens de forma deterministica", () => {
    expect(hashTokenSeguro("abc")).toBe(hashTokenSeguro("abc"));
  });

  test("hashea y verifica contrasenas", async () => {
    const hash = await hashContrasena("Clave1234", 4);
    await expect(verificarContrasena("Clave1234", hash)).resolves.toBe(true);
    await expect(verificarContrasena("Clave1235", hash)).resolves.toBe(false);
  });

  test("normaliza lista de orígenes", () => {
    expect(
      normalizarListaOrigenes(" http://localhost:5173, https://web.example "),
    ).toEqual(["http://localhost:5173", "https://web.example"]);
  });
});
