import { clienteApi, getBinario } from "../api/cliente-api";

function extraerDatos(raw) {
  return raw?.datos ?? raw?.data ?? raw;
}

export async function listarSemanas(params) {
  const { data } = await clienteApi.get("/menu/semanas", { params });
  const payload = extraerDatos(data);
  // La API devuelve el array directamente en datos; normalizamos al formato que la página espera.
  if (Array.isArray(payload)) return { semanas: payload };
  return payload;
}

export async function obtenerSemana(id) {
  const { data } = await clienteApi.get(`/menu/semanas/${id}`);
  return extraerDatos(data);
}

export async function listarVersiones(semanaId) {
  const { data } = await clienteApi.get(`/menu/semanas/${semanaId}/versiones`);
  return extraerDatos(data);
}

export async function actualizarDia(semanaId, versionId, fecha, payload) {
  const { data } = await clienteApi.put(
    `/menu/semanas/${semanaId}/versiones/${versionId}/dias/${fecha}`,
    payload,
  );
  return extraerDatos(data);
}

export async function actualizarOpciones(semanaId, versionId, fecha, payload) {
  const { data } = await clienteApi.put(
    `/menu/semanas/${semanaId}/versiones/${versionId}/dias/${fecha}/opciones`,
    payload,
  );
  return extraerDatos(data);
}

export async function obtenerMensajeWhatsapp(semanaId, params) {
  const { data } = await clienteApi.get(
    `/menu/semanas/${semanaId}/mensaje-whatsapp`,
    { params },
  );
  return extraerDatos(data);
}

export async function descargarExcel(semanaId, params) {
  return getBinario(`/menu/semanas/${semanaId}/exportar/excel`, { params });
}
