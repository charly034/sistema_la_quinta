import { describe, test, expect } from "@jest/globals";
import { execSync } from "child_process";
import {
  API_ROOT,
  obtenerUrlPruebas,
  validarBasePruebas,
} from "./utils/entorno-pruebas.js";

const ROOT_API = API_ROOT;

function cargarDatabaseUrlPruebas() {
  return obtenerUrlPruebas();
}

describe("Etapa 3G - Protección script reset-db-pruebas", () => {
  test("rechaza ejecución sin confirmación explícita", () => {
    const dbUrl = cargarDatabaseUrlPruebas();
    validarBasePruebas(dbUrl);
    const env = {
      ...process.env,
      DATABASE_URL_PRUEBAS: dbUrl,
    };
    delete env.DATABASE_URL;
    // Asegura que no herede una confirmación previa del entorno de la sesión.
    delete env.RESET_DB_CONFIRMACION;

    try {
      execSync("node ./scripts/reset-db-pruebas.cjs", {
        cwd: ROOT_API,
        stdio: "pipe",
        env,
      });
      throw new Error("El script debía fallar sin confirmación");
    } catch (error) {
      const salida = String(error?.stderr || error?.stdout || error?.message);
      expect(salida).toMatch(/Confirmación requerida/i);
    }
  });
});
