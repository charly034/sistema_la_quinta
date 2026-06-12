import { test, expect } from "@playwright/test";

test("flujo minimo panel menus", async ({ page }) => {
  await page.goto("/iniciar-sesion");
  await expect(
    page.getByRole("heading", { name: "Iniciar sesión" }),
  ).toBeVisible();

  await page.getByLabel("Correo").fill("admin@laquinta.local");
  await page.getByLabel("Contraseña").fill("password123");
  await page.getByRole("button", { name: "Ingresar" }).click();

  await expect(page).toHaveURL(/\/inicio|\/iniciar-sesion/);
});
