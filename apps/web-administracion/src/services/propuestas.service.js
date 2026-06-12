import { clienteApi } from "../api/cliente-api";

export async function generarPropuestas(semanaId, versionId, payload) {
  const { data } = await clienteApi.post(
    `/menu/semanas/${semanaId}/versiones/${versionId}/propuestas/generar`,
    payload,
  );
  return data?.data || data;
}

export async function generarPropuestaPersonalizada(
  semanaId,
  versionId,
  payload,
) {
  const { data } = await clienteApi.post(
    `/menu/semanas/${semanaId}/versiones/${versionId}/propuestas/generar-personalizada`,
    payload,
  );
  return data?.data || data;
}

export async function listarPropuestas(semanaId, versionId, params) {
  const { data } = await clienteApi.get(
    `/menu/semanas/${semanaId}/versiones/${versionId}/propuestas`,
    { params },
  );
  return data?.data || data;
}

export async function obtenerPropuesta(semanaId, versionId, propuestaId) {
  const { data } = await clienteApi.get(
    `/menu/semanas/${semanaId}/versiones/${versionId}/propuestas/${propuestaId}`,
  );
  return data?.data || data;
}

export async function aplicarPropuesta(semanaId, versionId, propuestaId) {
  const { data } = await clienteApi.post(
    `/menu/semanas/${semanaId}/versiones/${versionId}/propuestas/${propuestaId}/aplicar`,
  );
  return data?.data || data;
}
