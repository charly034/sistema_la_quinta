import { clienteApi } from "../api/cliente-api";

export async function iniciarSesion(payload) {
  const { data } = await clienteApi.post(
    "/autenticacion/iniciar-sesion",
    payload,
  );
  return data?.data || data;
}

export async function renovarSesion(refreshToken) {
  const { data } = await clienteApi.post("/autenticacion/renovar-sesion", {
    refreshToken,
  });
  return data?.data || data;
}

export async function cerrarSesion(refreshToken) {
  const { data } = await clienteApi.post("/autenticacion/cerrar-sesion", {
    refreshToken,
  });
  return data?.data || data;
}

export async function obtenerMiPerfil() {
  const { data } = await clienteApi.get("/autenticacion/mi-perfil");
  return data?.data || data;
}
