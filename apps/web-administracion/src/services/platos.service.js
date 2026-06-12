import { clienteApi } from "../api/cliente-api";

export async function listarPlatos(params) {
  const { data } = await clienteApi.get("/menu/platos", { params });
  return data?.data || data;
}

export async function crearPlato(payload) {
  const { data } = await clienteApi.post("/menu/platos", payload);
  return data?.data || data;
}

export async function actualizarEstadoPlato(id, payload) {
  const { data } = await clienteApi.patch(`/menu/platos/${id}/estado`, payload);
  return data?.data || data;
}

export async function actualizarFavoritoPlato(id, payload) {
  const { data } = await clienteApi.patch(
    `/menu/platos/${id}/favorito`,
    payload,
  );
  return data?.data || data;
}

export async function listarClasificacion(recurso, params) {
  const { data } = await clienteApi.get(`/menu/${recurso}`, { params });
  return data?.data || data;
}
