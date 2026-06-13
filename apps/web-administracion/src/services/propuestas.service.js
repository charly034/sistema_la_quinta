import { clienteApi } from "../api/cliente-api";

function extraerDatos(raw) {
  return raw?.datos ?? raw?.data ?? raw;
}

export async function generarPropuestas(semanaId, versionId, payload) {
  const { data } = await clienteApi.post(
    `/menu/semanas/${semanaId}/versiones/${versionId}/propuestas/generar`,
    payload,
    { timeout: 120000 }, // El motor puede tardar hasta ~45s por 3 perfiles
  );
  return extraerDatos(data);
}

export async function generarPropuestaPersonalizada(
  semanaId,
  versionId,
  payload,
) {
  const { data } = await clienteApi.post(
    `/menu/semanas/${semanaId}/versiones/${versionId}/propuestas/generar-personalizada`,
    payload,
    { timeout: 120000 },
  );
  return extraerDatos(data);
}

export async function listarPropuestas(semanaId, versionId, params) {
  const { data } = await clienteApi.get(
    `/menu/semanas/${semanaId}/versiones/${versionId}/propuestas`,
    { params },
  );
  const payload = extraerDatos(data);
  // Normalizamos al formato que EditorMenuPage espera: {items: [...]}
  if (Array.isArray(payload)) return { items: payload };
  return payload;
}

export async function obtenerPropuesta(semanaId, versionId, propuestaId) {
  const { data } = await clienteApi.get(
    `/menu/semanas/${semanaId}/versiones/${versionId}/propuestas/${propuestaId}`,
  );
  return extraerDatos(data);
}

export async function aplicarPropuesta(semanaId, versionId, propuestaId) {
  const { data } = await clienteApi.post(
    `/menu/semanas/${semanaId}/versiones/${versionId}/propuestas/${propuestaId}/aplicar`,
  );
  return extraerDatos(data);
}
