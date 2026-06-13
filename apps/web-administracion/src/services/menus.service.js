import { clienteApi, getBinario } from "../api/cliente-api";

function extraerDatos(raw) {
  return raw?.datos ?? raw?.data ?? raw;
}

function addDaysIso(fechaIso, days) {
  const d = new Date(`${fechaIso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function normalizarOpcional(valor) {
  return valor ? valor : null;
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
  const payload = extraerDatos(data);
  const dias = payload?.diasYOpciones || [];
  return {
    ...payload,
    versionActual: payload?.versionActual
      ? { ...payload.versionActual, dias }
      : payload?.versionActual,
    versionPublicada: payload?.versionPublicada
      ? { ...payload.versionPublicada, dias }
      : payload?.versionPublicada,
  };
}

export async function crearSemana(payload) {
  const fechaInicio = payload?.fechaInicio;
  const requestBody = {
    marcaId: payload?.marcaId,
    canalId: normalizarOpcional(payload?.canalId),
    empresaId: normalizarOpcional(payload?.empresaId),
    fechaInicio,
    fechaFin: addDaysIso(fechaInicio, 6),
  };

  const { data } = await clienteApi.post("/menu/semanas", requestBody);
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
