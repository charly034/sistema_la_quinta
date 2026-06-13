import { clienteApi } from "../api/cliente-api";

// La API devuelve {datos: {...}}; los mocks de test devuelven {data: {...}}.
// Verificamos ambos para compatibilidad.
function extraerDatos(raw) {
  return raw?.datos ?? raw?.data ?? raw;
}

export async function iniciarSesion(payload) {
  const { data } = await clienteApi.post(
    "/autenticacion/iniciar-sesion",
    payload,
  );
  return extraerDatos(data);
}

export async function renovarSesion(refreshToken) {
  const { data } = await clienteApi.post("/autenticacion/renovar-sesion", {
    refreshToken,
  });
  return extraerDatos(data);
}

export async function cerrarSesion(refreshToken) {
  const { data } = await clienteApi.post("/autenticacion/cerrar-sesion", {
    refreshToken,
  });
  return extraerDatos(data);
}

export async function obtenerMiPerfil() {
  const { data } = await clienteApi.get("/autenticacion/mi-perfil");
  return extraerDatos(data);
}
