import { clienteApi } from "../api/cliente-api";

export async function listarReglas(params) {
  const { data } = await clienteApi.get("/menu/reglas", { params });
  return data?.data || data;
}

export async function crearRegla(payload) {
  const { data } = await clienteApi.post("/menu/reglas", payload);
  return data?.data || data;
}

export async function actualizarRegla(id, payload) {
  const { data } = await clienteApi.patch(`/menu/reglas/${id}`, payload);
  return data?.data || data;
}

export async function cambiarEstadoRegla(id, payload) {
  const { data } = await clienteApi.patch(`/menu/reglas/${id}/estado`, payload);
  return data?.data || data;
}

export async function evaluarRegla(payload) {
  const { data } = await clienteApi.post("/menu/reglas/evaluar", payload);
  return data?.data || data;
}
