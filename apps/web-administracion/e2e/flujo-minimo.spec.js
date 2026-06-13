/**
 * Sanity check: página de login accesible.
 * Los flujos completos están en auth.spec.js, platos.spec.js,
 * editor.spec.js y auditoria.spec.js.
 */
import { test, expect } from "@playwright/test";

test("sanity: página de inicio de sesión está disponible", async ({ page }) => {
  await page.goto("/iniciar-sesion");
  await expect(
    page.getByRole("heading", { name: "Iniciar sesión" }),
  ).toBeVisible();
  await expect(page.getByLabel("Correo")).toBeVisible();
  await expect(page.getByLabel("Contraseña")).toBeVisible();
  await expect(page.getByRole("button", { name: "Ingresar" })).toBeVisible();
});
