import { clienteApi, getBinario } from "../api/cliente-api";

export async function listarSemanas(params) {
  const { data } = await clienteApi.get("/menu/semanas", { params });
  return data?.data || data;
}

export async function obtenerSemana(id) {
  const { data } = await clienteApi.get(`/menu/semanas/${id}`);
  return data?.data || data;
}

export async function listarVersiones(semanaId) {
  const { data } = await clienteApi.get(`/menu/semanas/${semanaId}/versiones`);
  return data?.data || data;
}

export async function actualizarDia(semanaId, versionId, fecha, payload) {
  const { data } = await clienteApi.put(
    `/menu/semanas/${semanaId}/versiones/${versionId}/dias/${fecha}`,
    payload,
  );
  return data?.data || data;
}

export async function actualizarOpciones(semanaId, versionId, fecha, payload) {
  const { data } = await clienteApi.put(
    `/menu/semanas/${semanaId}/versiones/${versionId}/dias/${fecha}/opciones`,
    payload,
  );
  return data?.data || data;
}

export async function obtenerMensajeWhatsapp(semanaId, params) {
  const { data } = await clienteApi.get(
    `/menu/semanas/${semanaId}/mensaje-whatsapp`,
    { params },
  );
  return data?.data || data;
}

export async function descargarExcel(semanaId, params) {
  return getBinario(`/menu/semanas/${semanaId}/exportar/excel`, { params });
}
