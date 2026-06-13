/**
 * E2E: Autenticación real
 *
 * Evidencia:
 *   preparado_por_api  : usuario E2E creado en globalSetup
 *   ejecutado_desde_ui : toda interacción de este spec
 *   verificado_por_api : no aplica (la redirección es evidencia suficiente)
 *
 * Operaciones:
 *   1  Login completo desde formulario UI
 *   2  Verificar perfil visible y navegación
 *   3  Logout desde UI
 *   4  Verificar redirección a /iniciar-sesion
 *   5  Verificar que ruta protegida ya no es accesible
 *   6  Refresh real de sesión (via interceptor contra API real)
 */
import { test, expect } from "@playwright/test";

const CORREO = () => process.env.E2E_USUARIO_CORREO;
const CONTRASENA = () => process.env.E2E_USUARIO_CONTRASENA;

async function loginDesdeUI(page) {
  await page.goto("/iniciar-sesion");
  await expect(
    page.getByRole("heading", { name: "Iniciar sesión" }),
  ).toBeVisible();
  await page.getByLabel("Correo").fill(CORREO());
  await page.getByLabel("Contraseña").fill(CONTRASENA());
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/inicio/, { timeout: 20000 });
}

test.describe("Autenticación real — UI", () => {
  test("Login, perfil, navegación y logout desde formulario", async ({
    page,
  }) => {
    // ─── Paso 1: Abrir formulario de login ───
    await page.goto("/iniciar-sesion");
    await expect(
      page.getByRole("heading", { name: "Iniciar sesión" }),
    ).toBeVisible();

    // ─── Paso 2-4: Completar credenciales y enviar ───
    // ejecutado_desde_ui: completar correo
    await page.getByLabel("Correo").fill(CORREO());
    // ejecutado_desde_ui: completar contraseña
    await page.getByLabel("Contraseña").fill(CONTRASENA());
    // ejecutado_desde_ui: enviar formulario
    await page.getByRole("button", { name: "Ingresar" }).click();

    // ─── Paso 5: Confirmar redirección ───
    await expect(page).toHaveURL(/\/inicio/, { timeout: 20000 });

    // ─── Paso 6: Confirmar perfil visible ───
    await expect(page.locator(".encabezado__usuario")).toBeVisible();

    // ─── Paso 7: Confirmar navegación visible según permisos ───
    await expect(page.locator(".sidebar")).toBeVisible();
    // Navegar vía SPA (no page.goto — los tokens están en memoria)
    await page.getByRole("link", { name: "Menús semanales" }).first().click();
    await expect(
      page.locator("h2").filter({ hasText: "Menús semanales" }),
    ).toBeVisible({ timeout: 10000 });
    // Auditoría también visible según permisos del propietario
    await page.getByRole("link", { name: "Auditoría" }).first().click();
    await expect(
      page.locator("h2").filter({ hasText: "Auditoría" }),
    ).toBeVisible({ timeout: 10000 });

    // ─── Paso 8: Cerrar sesión desde UI ───
    await page.getByRole("button", { name: "Cerrar sesión" }).click();

    // ─── Paso 9: Confirmar redirección a login ───
    await expect(page).toHaveURL(/\/iniciar-sesion/, { timeout: 10000 });

    // ─── Paso 10: Confirmar que ruta protegida ya no es accesible ───
    await page.goto("/menus");
    await expect(page).toHaveURL(/\/iniciar-sesion/, { timeout: 10000 });
  });

  test("Refresh real de sesión: interceptor renueva token y continúa autenticado", async ({
    page,
  }) => {
    // Nota: El 401 inicial es simulado para controlar el timing.
    // La llamada a /autenticacion/renovar-sesion va a la API REAL.
    await loginDesdeUI(page);

    // Contar llamadas reales a renovar-sesion
    let renovarLlamadas = 0;
    await page.route("**/autenticacion/renovar-sesion", async (route) => {
      renovarLlamadas++;
      await route.continue();
    });

    // Simular un 401 en la primera solicitud a /menu/platos
    // (como si el access token hubiera expirado)
    let primeraInterceptada = false;
    await page.route("**/menu/platos**", async (route) => {
      if (!primeraInterceptada) {
        primeraInterceptada = true;
        await route.fulfill({
          status: 401,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            error: { code: "TOKEN_EXPIRADO", message: "Token expirado" },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Navegar a /platos vía SPA (no page.goto → tokens preservados)
    await page.getByRole("link", { name: "Platos" }).first().click();

    // Esperar que la página cargue (no redirige a login = refresh fue exitoso)
    await expect(
      page.getByRole("heading", { name: "Catálogo de platos" }),
      "La página debe seguir cargando después del refresh (no redirigir a login)",
    ).toBeVisible({ timeout: 30000 });

    // Verificar que la UI continúa autenticada
    await expect(page).not.toHaveURL(/\/iniciar-sesion/);

    // Verificar una sola renovación (no bucle infinito)
    expect(renovarLlamadas).toBe(1);

    // Segunda navegación: NO debe renovar de nuevo (token nuevo es válido)
    const renovarAntes = renovarLlamadas;
    await page
      .locator("h2")
      .filter({ hasText: "Catálogo de platos" })
      .waitFor({ state: "visible", timeout: 5000 });
    await page.getByRole("link", { name: "Inicio" }).first().click();
    await page.getByRole("link", { name: "Platos" }).first().click();
    await expect(
      page.locator("h2").filter({ hasText: "Catálogo de platos" }),
    ).toBeVisible({ timeout: 15000 });
    expect(renovarLlamadas).toBe(renovarAntes); // No renovó otra vez
  });
});
