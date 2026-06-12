/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/set-state-in-effect */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { setManejadorSesionExpirada } from "../api/cliente-api";
import { clearTokens, getRefreshToken, setTokens } from "./token-store";
import {
  cerrarSesion,
  iniciarSesion,
  obtenerMiPerfil,
} from "../services/auth.service";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargandoPerfil, setCargandoPerfil] = useState(
    Boolean(getRefreshToken()),
  );

  const logout = useCallback(async () => {
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await cerrarSesion(refreshToken);
      }
    } catch {
      // El backend define si la sesión ya estaba revocada.
    } finally {
      clearTokens();
      setUsuario(null);
    }
  }, []);

  useEffect(() => {
    setManejadorSesionExpirada(() => logout);
  }, [logout]);

  const hydratePerfil = useCallback(async () => {
    try {
      const perfil = await obtenerMiPerfil();
      setUsuario({
        ...perfil,
        permisos: perfil?.permisos || [],
      });
    } catch {
      setUsuario(null);
      clearTokens();
    } finally {
      setCargandoPerfil(false);
    }
  }, []);

  const login = useCallback(async (credenciales) => {
    const data = await iniciarSesion(credenciales);
    setTokens({
      accessToken: data?.accessToken,
      refreshToken: data?.refreshToken,
    });
    setUsuario({
      ...data?.usuario,
      permisos: data?.usuario?.permisos || [],
    });
    return data;
  }, []);

  useEffect(() => {
    const token = getRefreshToken();
    if (token) hydratePerfil();
  }, [hydratePerfil]);

  const value = useMemo(
    () => ({
      usuario,
      cargandoPerfil,
      login,
      logout,
      refrescarPerfil: hydratePerfil,
      autenticado: Boolean(usuario),
    }),
    [usuario, cargandoPerfil, login, logout, hydratePerfil],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return value;
}
