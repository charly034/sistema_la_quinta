import { describe, test, expect } from "@jest/globals";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT_API = path.resolve(process.cwd());
const ENV_PATH = path.join(ROOT_API, ".env");

function cargarDatabaseUrlPruebas() {
  const texto = fs.readFileSync(ENV_PATH, "utf8");
  const match = texto.match(/^\s*DATABASE_URL_PRUEBAS\s*=\s*(.+)\s*$/m);
  if (!match) throw new Error("DATABASE_URL_PRUEBAS no definida");
  return match[1].trim().replace(/^['\"]|['\"]$/g, "");
}

describe("Etapa 3G - Protección script reset-db-pruebas", () => {
  test("rechaza ejecución sin confirmación explícita", () => {
    const dbUrl = cargarDatabaseUrlPruebas();
    const env = {
      ...process.env,
      DATABASE_URL_PRUEBAS: dbUrl,
    };
    delete env.DATABASE_URL;

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
