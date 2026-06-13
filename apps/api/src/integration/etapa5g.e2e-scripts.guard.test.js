import { describe, expect, test } from "@jest/globals";
import { spawnSync } from "node:child_process";
import path from "node:path";

function apiRoot() {
  const cwd = process.cwd();
  return path.basename(cwd) === "api" ? cwd : path.join(cwd, "apps", "api");
}

function runScript(scriptName, env = {}) {
  const result = spawnSync("node", [path.join("scripts", scriptName)], {
    cwd: apiRoot(),
    env: {
      ...process.env,
      DATABASE_URL: "",
      DB_HOST: "",
      DB_PORT: "",
      DB_NAME: "",
      DB_USER: "",
      DB_PASSWORD: "",
      ...env,
    },
    encoding: "utf8",
  });

  return {
    code: result.status ?? 1,
    output: `${result.stdout || ""}\n${result.stderr || ""}`,
  };
}

describe("ETAPA 5G - guardas scripts E2E", () => {
  const scripts = [
    "crear-usuario-e2e.cjs",
    "limpiar-datos-e2e.cjs",
    "seed-reglas-e2e.cjs",
    "seed-plantillas-whatsapp-e2e.cjs",
  ];

  for (const script of scripts) {
    test(`${script} rechaza ausencia de DATABASE_URL_PRUEBAS`, () => {
      const res = runScript(script, {
        DATABASE_URL_PRUEBAS: "",
        E2E_USUARIO_CORREO: "e2e-propietario@laquinta.local",
        E2E_USUARIO_CONTRASENA: "E2ePrueba-Pw1234",
      });
      expect(res.code).not.toBe(0);
      expect(res.output).toMatch(/DATABASE_URL_PRUEBAS es obligatoria/i);
    });

    test(`${script} rechaza host de produccion`, () => {
      const res = runScript(script, {
        DATABASE_URL_PRUEBAS:
          "postgres://user:pass@prod-db.internal:5432/la_quinta_pruebas",
        E2E_USUARIO_CORREO: "e2e-propietario@laquinta.local",
        E2E_USUARIO_CONTRASENA: "E2ePrueba-Pw1234",
      });
      expect(res.code).not.toBe(0);
      expect(res.output).toMatch(/anti-producci/i);
    });
  }
});
