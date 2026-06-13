/**
 * E2E: Creación de plato desde interfaz
 *
 * Evidencia:
 *   preparado_por_api  : marcaId obtenido de process.env.E2E_MARCA_ID (sembrado en globalSetup)
 *   ejecutado_desde_ui : login, navegación a /platos, llenado de formulario, submit
 *   verificado_por_api : consulta POST-UI para confirmar persistencia en DB
 *
 * Tipos de plato probados:
 *   PREPARACION     → aceptado por backend
 *   GUARNICION      → aceptado
 *   PLATO_COMPLETO  → aceptado (usado en este test)
 *   PRINCIPAL       → no aparece en el select (contrato verificado en vitest)
 */
import { test, expect } from "@playwright/test";
import { loginApi, listarPlatosPorNombre } from "./helpers/api.mjs";

const CORREO = () => process.env.E2E_USUARIO_CORREO;
const CONTRASENA = () => process.env.E2E_USUARIO_CONTRASENA;
const API_URL = () => process.env.E2E_API_URL || "http://localhost:3001";

test("Crear plato con tipo PLATO_COMPLETO desde interfaz y verificar persistencia", async ({
  page,
}) => {
  // preparado_por_api: marcaId ya disponible de globalSetup
  const marcaId = process.env.E2E_MARCA_ID;
  expect(
    marcaId,
    "E2E_MARCA_ID debe estar definido por globalSetup",
  ).toBeTruthy();

  const runTag = process.env.E2E_RUN_TAG || `E2ETEST_${Date.now()}`;
  const nombrePlato = `${runTag}_UI_PlatoCompleto`;

  // ejecutado_desde_ui: login
  await page.goto("/iniciar-sesion");
  await page.getByLabel("Correo").fill(CORREO());
  await page.getByLabel("Contraseña").fill(CONTRASENA());
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/inicio/, { timeout: 20000 });

  // ejecutado_desde_ui: navegar a /platos vía SPA (no page.goto → tokens preservados)
  await page.getByRole("link", { name: "Platos" }).first().click();
  await expect(
    page.getByRole("heading", { name: "Catálogo de platos" }),
  ).toBeVisible({ timeout: 15000 });

  // ejecutado_desde_ui: llenar formulario de creación
  // Marca ID (se usa el ID obtenido de API como referencia de configuración)
  await page.getByPlaceholder("Marca ID").fill(marcaId);

  // ejecutado_desde_ui: seleccionar tipo PLATO_COMPLETO
  await page
    .locator("[data-testid='tipo-plato']")
    .selectOption("PLATO_COMPLETO");

  // ejecutado_desde_ui: ingresar nombre único
  await page.getByPlaceholder("Nombre").fill(nombrePlato);

  // ejecutado_desde_ui: guardar
  await page.getByRole("button", { name: "Crear plato" }).click();

  // ejecutado_desde_ui: confirmar éxito (el formulario se resetea)
  await expect(page.getByPlaceholder("Nombre")).toHaveValue("", {
    timeout: 15000,
  });
  await expect(page.locator("[data-testid='tipo-plato']")).toHaveValue(
    "PREPARACION",
  ); // Valor predeterminado post-reset

  // verificado_por_api: confirmar que el plato existe en el backend
  // (se loguea de nuevo a la API para obtener token de verificación)
  const loginData = await loginApi(CORREO(), CONTRASENA());
  const platos = await listarPlatosPorNombre(
    loginData.accessToken,
    nombrePlato,
  );
  const platoCreado = platos.find((p) => p.nombre === nombrePlato);

  expect(
    platoCreado,
    `El plato "${nombrePlato}" debe existir en la API después de crearlo desde UI`,
  ).toBeTruthy();
  expect(platoCreado.tipo).toBe("PLATO_COMPLETO");

  // Registrar para limpieza en teardown
  const yaRegistrados = JSON.parse(process.env._E2E_PLATOS_LIMPIAR || "[]");
  if (platoCreado?.id) {
    yaRegistrados.push(platoCreado.id);
    process.env._E2E_PLATOS_LIMPIAR = JSON.stringify(yaRegistrados);
  }

  console.log(
    `[E2E] Plato creado desde UI: ${platoCreado?.id} | ${nombrePlato}`,
  );
});
