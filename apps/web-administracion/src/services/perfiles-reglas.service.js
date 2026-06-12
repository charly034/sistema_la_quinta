import { clienteApi } from "../api/cliente-api";

export async function listarPerfilesReglas(params) {
  const { data } = await clienteApi.get("/menu/perfiles-reglas", { params });
  return data?.data || data;
}

export async function crearPerfilReglas(payload) {
  const { data } = await clienteApi.post("/menu/perfiles-reglas", payload);
  return data?.data || data;
}

export async function actualizarPerfilReglas(id, payload) {
  const { data } = await clienteApi.patch(
    `/menu/perfiles-reglas/${id}`,
    payload,
  );
  return data?.data || data;
}

export async function reemplazarReglasPerfil(id, payload) {
  const { data } = await clienteApi.put(
    `/menu/perfiles-reglas/${id}/reglas`,
    payload,
  );
  return data?.data || data;
}
