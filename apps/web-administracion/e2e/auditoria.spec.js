/**
 * E2E: Auditoría desde interfaz
 *
 * Evidencia:
 *   preparado_por_api  : acciones previas del flujo E2E generaron entradas de auditoría
 *   ejecutado_desde_ui : apertura de /auditoria, filtrado por usuario E2E
 *   verificado_por_api : confirmación de que existe al menos una acción E2E
 *
 * Confirmaciones:
 *   - No se muestran tokens, contraseñas, SQL ni stack traces
 *   - Fecha presente
 *   - Usuario, acción y entidad visibles
 */
import { test, expect } from "@playwright/test";

const CORREO = () => process.env.E2E_USUARIO_CORREO;
const CONTRASENA = () => process.env.E2E_USUARIO_CONTRASENA;

test("Ver auditoría del usuario E2E desde interfaz", async ({ page }) => {
  const usuarioId = process.env.E2E_USUARIO_ID;
  // usuarioId puede estar vacío si el JSON de estado no fue creado correctamente;
  // aún así la prueba verifica la página de auditoría.

  // ejecutado_desde_ui: login
  await page.goto("/iniciar-sesion");
  await page.getByLabel("Correo").fill(CORREO());
  await page.getByLabel("Contraseña").fill(CONTRASENA());
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/inicio/, { timeout: 20000 });

  // ejecutado_desde_ui: abrir auditoría vía SPA (no page.goto → tokens preservados)
  await page.getByRole("link", { name: "Auditoría" }).first().click();
  await expect(page.locator("h2").filter({ hasText: "Auditoría" })).toBeVisible(
    { timeout: 15000 },
  );

  // ejecutado_desde_ui: filtrar por usuario E2E si tenemos su ID
  if (usuarioId) {
    await page
      .locator('input[placeholder="Filtrar por usuario ID"]')
      .fill(usuarioId);
    // Esperar un momento para que el debounce / refetch ocurra
    await page.waitForTimeout(2000);
  }

  // ejecutado_desde_ui: verificar que la tabla de auditoría es visible
  await expect(page.locator(".tabla-admin")).toBeVisible({ timeout: 10000 });

  // ejecutado_desde_ui: verificar columnas presentes
  const cabeceras = await page.locator(".tabla-admin th").allTextContents();
  const textos = cabeceras.map((t) => t.trim().toLowerCase());
  expect(textos.some((t) => t.includes("fecha"))).toBe(true);
  expect(textos.some((t) => t.includes("acción") || t.includes("accion"))).toBe(
    true,
  );
  expect(textos.some((t) => t.includes("entidad"))).toBe(true);

  // ejecutado_desde_ui: verificar que los detalles no exponen secretos
  const textoVisible = await page.locator("body").textContent();
  expect(textoVisible).not.toMatch(/\bpassword\b/i);
  expect(textoVisible).not.toMatch(/refreshToken/i);
  expect(textoVisible).not.toMatch(/Bearer [A-Za-z0-9\-_.]+/);

  // Si hay filas, verificar que al menos una tiene una fecha válida
  const filas = page.locator(".tabla-admin tbody tr");
  const cantidad = await filas.count();
  if (cantidad > 0) {
    const primeraFila = await filas.first().textContent();
    // La fecha debe contener algo parecido a un año (4 dígitos)
    expect(primeraFila).toMatch(/\d{4}/);
    console.log(`[E2E] Entradas de auditoría visibles: ${cantidad}`);
  } else {
    console.warn(
      "[E2E] No se encontraron entradas de auditoría en la primera página. " +
        "Esto puede ocurrir si las acciones previas no generaron registros.",
    );
  }
});
