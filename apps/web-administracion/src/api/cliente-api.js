import axios from "axios";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "../auth/token-store";
import { normalizarError } from "../utils/errores";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

export const clienteApi = axios.create({
  baseURL,
  timeout: 30000,
});

let onSesionExpirada = null;
export function setManejadorSesionExpirada(handler) {
  onSesionExpirada = handler;
}

clienteApi.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

clienteApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config || {};
    const status = error?.response?.status;

    if (
      status === 401 &&
      !original.__reintento &&
      !String(original.url || "").includes("/autenticacion/renovar-sesion")
    ) {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokens();
        onSesionExpirada?.();
        throw normalizarError(error);
      }

      original.__reintento = true;
      try {
        const { data } = await clienteApi.post(
          "/autenticacion/renovar-sesion",
          { refreshToken },
        );
        // La API devuelve {datos: {...}}; los mocks de test usan {data: {...}}
        const payload = data?.datos ?? data?.data ?? data;
        setTokens({
          accessToken: payload?.accessToken,
          refreshToken: payload?.refreshToken,
        });
        original.headers = {
          ...(original.headers || {}),
          Authorization: `Bearer ${payload?.accessToken}`,
        };
        return clienteApi.request(original);
      } catch (refreshError) {
        clearTokens();
        onSesionExpirada?.();
        throw normalizarError(refreshError);
      }
    }

    throw normalizarError(error);
  },
);

export async function getBinario(url, config = {}) {
  return clienteApi.get(url, {
    ...config,
    responseType: "blob",
  });
}
