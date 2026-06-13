/**
 * Helpers HTTP para setup/verify del arnés E2E.
 * Solo usa fetch (Node.js 18+). No reemplaza acciones de UI.
 */

function apiUrl() {
  return `${process.env.E2E_API_URL || "http://localhost:3001"}/api/v1`;
}

function addDaysIso(fechaIso, days) {
  const d = new Date(`${fechaIso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export { addDaysIso };

export async function loginApi(correo, contrasena) {
  const res = await fetch(`${apiUrl()}/autenticacion/iniciar-sesion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ correo, contrasena }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`loginApi: ${res.status} ${err?.error?.code || ""}`);
  }
  const data = await res.json();
  return data.datos || data.data || data;
}

export async function obtenerMarcaLaQuinta(token) {
  const res = await fetch(`${apiUrl()}/marcas?pagina=1&tamano=100`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`obtenerMarcas: ${res.status}`);
  const body = await res.json();
  // API devuelve {datos: [...marcas...]} o {datos: {items: [...]}}
  const payload = body.datos ?? body.data ?? body;
  const marcas = Array.isArray(payload) ? payload : payload?.items || [];
  const marca = marcas.find((m) => m.codigo === "LA_QUINTA");
  if (!marca)
    throw new Error("Marca LA_QUINTA no encontrada en la BD de pruebas");
  return marca;
}

export async function obtenerOpcionesAyC(token, marcaId) {
  const res = await fetch(
    `${apiUrl()}/menu/opciones?marcaId=${marcaId}&pagina=1&tamano=50`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error(`obtenerOpciones: ${res.status}`);
  const body = await res.json();
  const payload = body.datos ?? body.data ?? body;
  const opciones = Array.isArray(payload) ? payload : payload?.items || [];
  const opA = opciones.find((o) => o.codigo === "A");
  const opC = opciones.find((o) => o.codigo === "C");
  if (!opA || !opC)
    throw new Error("Opciones A y C no encontradas para LA_QUINTA");
  return { A: opA, C: opC };
}

export async function crearPlatoApi(token, marcaId, nombre, codigo) {
  const res = await fetch(`${apiUrl()}/menu/platos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      marcaId,
      tipo: "PREPARACION",
      nombre,
      codigo,
      estado: "ACTIVO",
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`crearPlatoApi: ${res.status} ${JSON.stringify(err)}`);
  }
  const body = await res.json();
  return body.datos || body.data || body;
}

export async function configurarSemanaEditableApi(
  token,
  marcaId,
  opciones,
  platos,
  { semanaId, versionId, fechaInicio },
) {
  // Lunes = feriado
  await fetch(
    `${apiUrl()}/menu/semanas/${semanaId}/versiones/${versionId}/dias/${fechaInicio}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ estado: "FERIADO" }),
    },
  );

  // Solo martes como DIA_LABORAL con 2 posiciones para el motor
  // (1 día × 2 opciones = 2 posiciones → el motor completa en ms con cualquier semilla)
  const martes = addDaysIso(fechaInicio, 1);
  await fetch(
    `${apiUrl()}/menu/semanas/${semanaId}/versiones/${versionId}/dias/${martes}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ estado: "DIA_LABORAL" }),
    },
  );
  await fetch(
    `${apiUrl()}/menu/semanas/${semanaId}/versiones/${versionId}/dias/${martes}/opciones`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        opciones: [
          {
            opcionMenuMarcaId: opciones.A.id,
            platoId: platos.platoA.id,
            orden: 1,
          },
          {
            opcionMenuMarcaId: opciones.C.id,
            platoId: platos.platoC.id,
            orden: 2,
          },
        ],
      }),
    },
  );

  // Miércoles a viernes: DIA_LABORAL con platos de relleno (para WhatsApp/Excel con contenido)
  const platosDisponiblesRes = await fetch(
    `${apiUrl()}/menu/platos?marcaId=${marcaId}&pagina=1&tamano=20&estado=ACTIVO`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const platosBody = await platosDisponiblesRes.json();
  const platosPayload = platosBody.datos ?? platosBody.data ?? platosBody;
  const todosPlatos = Array.isArray(platosPayload)
    ? platosPayload
    : platosPayload?.items || [];
  const usados = new Set([platos.platoA.id, platos.platoC.id]);
  const relleno = todosPlatos.filter((p) => !usados.has(p.id));

  let idxR = 0;
  for (let i = 2; i <= 4; i++) {
    const fecha = addDaysIso(fechaInicio, i);
    await fetch(
      `${apiUrl()}/menu/semanas/${semanaId}/versiones/${versionId}/dias/${fecha}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ estado: "DIA_LABORAL" }),
      },
    );
    const pA = relleno[idxR % relleno.length];
    idxR++;
    const pC = relleno[idxR % relleno.length];
    idxR++;
    if (pA && pC && pA.id !== pC.id) {
      await fetch(
        `${apiUrl()}/menu/semanas/${semanaId}/versiones/${versionId}/dias/${fecha}/opciones`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            opciones: [
              { opcionMenuMarcaId: opciones.A.id, platoId: pA.id, orden: 1 },
              { opcionMenuMarcaId: opciones.C.id, platoId: pC.id, orden: 2 },
            ],
          }),
        },
      );
    }
  }

  // Sábado y domingo quedan SIN_CONFIGURAR (el motor no los toca por defecto)

  return { semanaId, versionId, fechaInicio };
}

export async function listarPlatosPorNombre(token, nombre) {
  const res = await fetch(
    `${apiUrl()}/menu/platos?buscar=${encodeURIComponent(nombre)}&pagina=1&tamano=10`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error(`listarPlatos: ${res.status}`);
  const body = await res.json();
  const payload = body.datos ?? body.data ?? body;
  return Array.isArray(payload) ? payload : payload?.items || [];
}

export async function listarAuditoriaUsuario(token, usuarioId) {
  const res = await fetch(
    `${apiUrl()}/auditoria?usuarioId=${usuarioId}&pagina=1&tamano=50`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error(`listarAuditoria: ${res.status}`);
  const body = await res.json();
  const payload = body.datos ?? body.data ?? body;
  return Array.isArray(payload)
    ? payload
    : payload?.items || payload?.auditoria || [];
}
