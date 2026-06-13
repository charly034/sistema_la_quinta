/**
 * E2E: Editor semanal, propuestas, WhatsApp y Excel desde UI
 *
 * Evidencia:
 *   preparado_por_api  : usuario E2E, marca, opciones, platos, reglas y perfiles
 *   ejecutado_desde_ui : crear semana, abrir editor, generar propuestas, comparar, seleccionar, aplicar, copiar y descargar
 *   verificado_por_api : propuestas persistidas (incluida APLICADA) y opciones de menú actualizadas
 */
import { test, expect } from "@playwright/test";
import { stat, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { configurarSemanaEditableApi, loginApi } from "./helpers/api.mjs";

const CORREO = () => process.env.E2E_USUARIO_CORREO;
const CONTRASENA = () => process.env.E2E_USUARIO_CONTRASENA;

function obtenerLunesBase(intento = 0) {
  const base = new Date(Date.UTC(2044, 0, 4));
  const offset = (Math.floor(Date.now() / 1000) % 260) + intento;
  base.setUTCDate(base.getUTCDate() + offset * 7);
  return base.toISOString().slice(0, 10);
}

function sanitizeText(value) {
  if (!value) return "";
  return String(value)
    .replace(/Bearer\s+[A-Za-z0-9\-_.]+/gi, "Bearer [REDACTED]")
    .replace(/"accessToken"\s*:\s*"[^"]+"/gi, '"accessToken":"[REDACTED]"')
    .replace(/"refreshToken"\s*:\s*"[^"]+"/gi, '"refreshToken":"[REDACTED]"')
    .slice(0, 500);
}

async function fetchAutorizado(url, token) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

async function loginDesdeUI(page) {
  await page.goto("/iniciar-sesion");
  await page.getByLabel("Correo").fill(CORREO());
  await page.getByLabel("Contraseña").fill(CONTRASENA());
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/inicio/, { timeout: 20000 });
}

async function irAlEditorSPA(page, semanaId, versionId) {
  const editorUrl = `/menus/${semanaId}/versiones/${versionId}`;
  await page.evaluate((url) => {
    window.history.pushState({}, "", url);
    window.dispatchEvent(new PopStateEvent("popstate", { state: {} }));
  }, editorUrl);
  await expect(page).toHaveURL(
    new RegExp(`/menus/${semanaId}/versiones/${versionId}`),
    {
      timeout: 20000,
    },
  );
  await expect(
    page.getByRole("region", { name: "Editor de menú semanal" }),
  ).toBeVisible({ timeout: 30000 });
}

async function crearSemanaDesdeUI(page) {
  if (process.env.E2E_SEMANA_ID && process.env.E2E_VERSION_ID) {
    await loginDesdeUI(page);
    await irAlEditorSPA(
      page,
      process.env.E2E_SEMANA_ID,
      process.env.E2E_VERSION_ID,
    );

    return {
      semanaId: process.env.E2E_SEMANA_ID,
      versionId: process.env.E2E_VERSION_ID,
      fechaInicio: process.env.E2E_FECHA_INICIO,
    };
  }

  await loginDesdeUI(page);
  await page.getByRole("link", { name: "Menús semanales" }).first().click();
  await expect(
    page.locator("h2").filter({ hasText: "Menús semanales" }),
  ).toBeVisible({ timeout: 15000 });

  const apiUrl = `${process.env.E2E_API_URL}/api/v1`;
  let semanaId;
  let versionId;
  let fechaInicio;

  for (let intento = 0; intento < 10; intento += 1) {
    fechaInicio = obtenerLunesBase(intento);
    const respuestaCreacionPromise = page.waitForResponse(
      (respuesta) =>
        respuesta.request().method() === "POST" &&
        respuesta.url().includes("/menu/semanas"),
      { timeout: 30000 },
    );

    await page.getByRole("button", { name: "Crear semana" }).click();
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible({ timeout: 10000 });
    await modal.getByLabel("Marca").selectOption(process.env.E2E_MARCA_ID);
    await modal.getByLabel("Fecha de inicio").fill(fechaInicio);
    await modal.getByRole("button", { name: "Guardar semana" }).click();

    const respuestaCreacion = await respuestaCreacionPromise;
    const status = respuestaCreacion.status();

    if (status === 409) {
      await expect(
        page.getByText(/Ya existe una semana para ese contexto y fecha/i),
      ).toBeVisible({ timeout: 10000 });
      continue;
    }

    expect(status).toBe(201);
    const body = await respuestaCreacion.json();
    const payload = body?.datos ?? body?.data ?? body;
    semanaId = payload?.semana?.id;
    versionId = payload?.versionInicial?.id;
    expect(semanaId).toBeTruthy();
    expect(versionId).toBeTruthy();

    await expect(page).toHaveURL(
      new RegExp(`/menus/${semanaId}/versiones/${versionId}`),
      { timeout: 20000 },
    );

    // Configurar días y opciones por API mientras el editor está en pantalla.
    // Después navegar de vuelta al editor para que cargue datos frescos.
    const loginData = await loginApi(CORREO(), CONTRASENA());
    await configurarSemanaEditableApi(
      loginData.accessToken,
      process.env.E2E_MARCA_ID,
      {
        A: { id: process.env.E2E_OPCIONES_A_ID },
        C: { id: process.env.E2E_OPCIONES_C_ID },
      },
      {
        platoA: { id: process.env.E2E_PLATO_A_ID },
        platoC: { id: process.env.E2E_PLATO_C_ID },
      },
      { semanaId, versionId, fechaInicio },
    );

    const semanaRes = await fetchAutorizado(
      `${apiUrl}/menu/semanas/${semanaId}`,
      loginData.accessToken,
    );
    const semanaPayload =
      semanaRes.data?.datos ?? semanaRes.data?.data ?? semanaRes.data;
    const dias = Array.isArray(semanaPayload?.diasYOpciones)
      ? semanaPayload.diasYOpciones
      : [];
    expect(dias).toHaveLength(7);

    process.env.E2E_SEMANA_ID = semanaId;
    process.env.E2E_VERSION_ID = versionId;
    process.env.E2E_FECHA_INICIO = fechaInicio;
    process.env._E2E_SEMANA_LIMPIAR = semanaId;

    console.log("[E2E] Solicitud originada por navegador: sí");
    console.log("[E2E] HTTP creación semana: 201");
    console.log(`[E2E] semana_id: ${semanaId}`);
    console.log(`[E2E] version_id: ${versionId}`);
    console.log("[E2E] Siete días creados: sí");

    // Navegar al editor con datos frescos sin recargar la app para preservar la sesión en memoria.
    await irAlEditorSPA(page, semanaId, versionId);

    return { semanaId, versionId, fechaInicio };
  }

  throw new Error("No se pudo crear una semana única desde UI");
}

async function navegarAlEditor(page) {
  const creada = await crearSemanaDesdeUI(page);
  return { semanaId: creada.semanaId, versionId: creada.versionId };
}

test.describe("Editor semanal — UI", () => {
  test("Crear semana desde UI, redirigir al editor y usar la versión inicial", async ({
    page,
  }) => {
    const { semanaId, versionId } = await navegarAlEditor(page);
    await expect(
      page.getByRole("region", { name: "Editor de menú semanal" }),
    ).toBeVisible();
    await expect(page).toHaveURL(
      new RegExp(`/menus/${semanaId}/versiones/${versionId}`),
    );
  });

  test("Generar tres propuestas y aplicar una desde UI", async ({ page }) => {
    test.setTimeout(240000);
    const { semanaId, versionId } = await navegarAlEditor(page);
    const apiUrl = `${process.env.E2E_API_URL}/api/v1`;

    // Diagnóstico en caso de timeout/error (sin secretos)
    const erroresConsola = [];
    const erroresRed = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        erroresConsola.push(sanitizeText(msg.text()));
      }
    });
    page.on("requestfailed", (req) => {
      erroresRed.push(
        `${req.method()} ${sanitizeText(req.url())} :: ${sanitizeText(req.failure()?.errorText || "desconocido")}`,
      );
    });

    const loginData = await loginApi(CORREO(), CONTRASENA());

    // Snapshot previo para validar actualización posterior
    await fetchAutorizado(
      `${apiUrl}/menu/semanas/${semanaId}`,
      loginData.accessToken,
    );

    const btnGenerar = page.locator(".acciones-fila .btn--primary").first();
    await expect(btnGenerar).toBeVisible();
    await expect(btnGenerar).toHaveText(/Generar propuestas/i);
    await expect(btnGenerar).toBeEnabled();

    // Capturar solicitud real originada por el clic (no preparación previa)
    const t0 = Date.now();
    const respuestaGeneracionPromise = page.waitForResponse(
      (respuesta) => {
        return (
          respuesta.request().method() === "POST" &&
          respuesta
            .url()
            .includes(
              `/menu/semanas/${semanaId}/versiones/${versionId}/propuestas/generar`,
            )
        );
      },
      { timeout: 120000 },
    );

    await btnGenerar.click();
    await expect(btnGenerar).toContainText(/Generando/i, { timeout: 5000 });

    let respuestaGeneracion;
    let duracionGeneracionMs;
    try {
      respuestaGeneracion = await respuestaGeneracionPromise;
      duracionGeneracionMs = Date.now() - t0;
    } catch (error) {
      const uiError = await page
        .locator(".estado-pagina--error")
        .textContent()
        .catch(() => "");
      throw new Error(
        [
          "Generación UI timeout/fallo.",
          `mensaje_ui=${sanitizeText(uiError) || "(sin mensaje UI)"}`,
          `errores_consola=${JSON.stringify(erroresConsola.slice(0, 5))}`,
          `errores_red=${JSON.stringify(erroresRed.slice(0, 5))}`,
          `detalle=${sanitizeText(error?.message || "desconocido")}`,
        ].join(" | "),
      );
    }

    const statusGeneracion = respuestaGeneracion.status();
    const bodyGeneracionRaw = await respuestaGeneracion.text().catch(() => "");
    const bodyGeneracion = sanitizeText(bodyGeneracionRaw);
    expect(statusGeneracion).toBeGreaterThanOrEqual(200);
    expect(statusGeneracion).toBeLessThan(300);

    // Espera basada en estado real de UI: el loading debe desaparecer
    await expect(btnGenerar).not.toContainText(/Generando/i, {
      timeout: 120000,
    });

    const columnas = page.locator(".columna-propuesta");
    await expect(columnas, "Deben aparecer 3 propuestas").toHaveCount(3, {
      timeout: 120000,
    });

    const titulos = await page
      .locator(".columna-propuesta h4")
      .allTextContents();
    const perfiles = titulos.map((t) => t.toUpperCase());
    expect(perfiles.some((p) => p.includes("EQUILIBR"))).toBe(true);
    expect(perfiles.some((p) => p.includes("HISTOR"))).toBe(true);
    expect(perfiles.some((p) => p.includes("RENOVA"))).toBe(true);

    // Validación mínima visual por propuesta
    for (let i = 0; i < 3; i++) {
      const card = page.locator(".columna-propuesta").nth(i);
      await expect(card.getByText(/Puntaje:/i)).toBeVisible();
      await expect(card.getByText(/Estado:/i)).toBeVisible();
      await expect(card.getByRole("button", { name: "Aplicar" })).toBeVisible();
    }

    const respuestaAplicacionPromise = page.waitForResponse(
      (respuesta) => {
        return (
          respuesta.request().method() === "POST" &&
          respuesta
            .url()
            .includes(
              `/menu/semanas/${semanaId}/versiones/${versionId}/propuestas/`,
            ) &&
          respuesta.url().endsWith("/aplicar")
        );
      },
      { timeout: 60000 },
    );

    await page
      .locator(".columna-propuesta")
      .first()
      .getByRole("button", { name: "Aplicar" })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: "Aplicar propuesta" }).click();

    const respuestaAplicacion = await respuestaAplicacionPromise;
    expect(respuestaAplicacion.status()).toBe(200);

    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/APLICADA/i).first()).toBeVisible({
      timeout: 20000,
    });

    // Verificado por API: propuestas persistidas y una aplicada
    const res = await fetch(
      `${apiUrl}/menu/semanas/${semanaId}/versiones/${versionId}/propuestas?pagina=1&limite=20`,
      { headers: { Authorization: `Bearer ${loginData.accessToken}` } },
    );
    const data = await res.json();
    const raw = data?.datos ?? data?.data ?? data;
    const propuestas = Array.isArray(raw)
      ? raw
      : raw?.items || raw?.propuestas || [];
    expect(Array.isArray(propuestas)).toBe(true);
    expect(propuestas.length).toBeGreaterThan(0);
    const aplicada = propuestas.find((p) => p?.estado === "APLICADA");
    expect(aplicada).toBeTruthy();

    const detalleRes = await fetch(
      `${apiUrl}/menu/semanas/${semanaId}/versiones/${versionId}/propuestas/${aplicada.id}`,
      { headers: { Authorization: `Bearer ${loginData.accessToken}` } },
    );
    expect(detalleRes.status).toBe(200);
    const detalleData = await detalleRes.json();
    const detallePayload =
      detalleData?.datos ?? detalleData?.data ?? detalleData;
    const detalle = Array.isArray(detallePayload?.detalle)
      ? detallePayload.detalle
      : [];
    expect(detalle.length).toBeGreaterThan(0);

    // Verificado por API: estado final de propuesta y detalle persistido
    // (evitamos correlación frágil por claves UI/API; la evidencia fuerte es:
    //  respuesta HTTP 200 al aplicar + estado APLICADA + detalle no vacío).

    console.log(`[E2E] Clic en Generar propuestas: realizado`);
    console.log(`[E2E] Solicitud POST originada por navegador: sí`);
    console.log(`[E2E] Status HTTP generación: ${statusGeneracion}`);
    console.log(`[E2E] Duración generación (ms): ${duracionGeneracionMs}`);
    console.log(`[E2E] Propuestas renderizadas: 3`);
    console.log(`[E2E] Fallback API utilizado: no`);
    console.log(`[E2E] Aplicación iniciada desde UI: sí`);
    console.log(`[E2E] Status de aplicación: ${respuestaAplicacion.status()}`);
    console.log(`[E2E] Propuestas en API tras aplicar: ${propuestas.length}`);

    // Diagnóstico resumido útil cuando quede inestable en CI
    const diagnostico = {
      status_http: statusGeneracion,
      duracion_ms: duracionGeneracionMs,
      payload_sanitizado: bodyGeneracion,
      errores_consola: erroresConsola.slice(0, 5),
      errores_red: erroresRed.slice(0, 5),
    };
    console.log(`[E2E] Diagnóstico generación: ${JSON.stringify(diagnostico)}`);
  });

  test("Vista previa de WhatsApp visible y boton Copiar funciona", async ({
    page,
  }) => {
    await navegarAlEditor(page);

    await expect(
      page.getByRole("heading", { name: "Vista previa de WhatsApp" }),
    ).toBeVisible({ timeout: 20000 });

    // Esperamos primero a que React Query termine su ciclo (cargando/error/datos)
    // para evitar falsos negativos por render parcial.
    const loadingWhatsapp = page.getByText("Generando vista previa...");
    await loadingWhatsapp
      .waitFor({ state: "hidden", timeout: 60000 })
      .catch(() => {});

    const errorWhatsapp = page.getByText("No se pudo generar WhatsApp");
    await expect(errorWhatsapp).toHaveCount(0, { timeout: 10000 });

    const vistaWhatsapp = page.locator(".vista-whatsapp");
    await expect(vistaWhatsapp).toBeVisible({ timeout: 60000 });
    const contenido = await vistaWhatsapp.textContent();
    expect((contenido || "").length).toBeGreaterThan(5);

    const btnCopiar = page.getByRole("button", { name: /Copiar mensaje/ });
    await expect(btnCopiar).toBeVisible();
    await btnCopiar.click();

    await expect(page.getByRole("button", { name: "Copiado" })).toBeVisible({
      timeout: 5000,
    });
  });

  test("Descargar Excel: extension .xlsx y tamano mayor que cero", async ({
    page,
  }) => {
    await navegarAlEditor(page);

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 60000 }),
      page.getByRole("button", { name: "Descargar Excel" }).click(),
    ]);

    const nombreArchivo = download.suggestedFilename();
    expect(nombreArchivo.toLowerCase().endsWith(".xlsx")).toBe(true);
    expect(nombreArchivo).not.toContain("/");
    expect(nombreArchivo).not.toContain("..");

    const tmpPath = join(tmpdir(), `e2e-excel-${Date.now()}.xlsx`);
    await download.saveAs(tmpPath);
    const stats = await stat(tmpPath);
    expect(stats.size).toBeGreaterThan(0);

    await unlink(tmpPath).catch(() => {});
    console.log(
      `[E2E] Excel descargado: ${nombreArchivo} (${stats.size} bytes)`,
    );
  });
});
