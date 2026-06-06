/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const AuthContext = createContext(null);

const usuariosIniciales = [
  {
    id: "USR-001",
    nombre: "Emiliano",
    rol: "admin",
    area: "Dirección",
    password: "Emiliano",
  },
  {
    id: "USR-002",
    nombre: "German",
    rol: "admin",
    area: "Dirección",
    password: "German",
  },
  {
    id: "USR-003",
    nombre: "Camila Torres",
    rol: "empleado",
    area: "RR. HH.",
    empleadoId: "EMP-001",
    password: "Camila Torres",
  },
  {
    id: "USR-004",
    nombre: "Julián Pérez",
    rol: "empleado",
    area: "Producción",
    empleadoId: "EMP-002",
    password: "Julián Pérez",
  },
  {
    id: "USR-005",
    nombre: "Lucía Gómez",
    rol: "empleado",
    area: "Logística",
    empleadoId: "EMP-003",
    password: "Lucía Gómez",
  },
  {
    id: "USR-006",
    nombre: "Matías Rivas",
    rol: "empleado",
    area: "Tecnología",
    empleadoId: "EMP-004",
    password: "Matías Rivas",
  },
];

const permisosPorRol = {
  admin: [
    "view_empleados",
    "view_adelantos",
    "create_adelanto",
    "update_adelanto",
    "export",
    "delete_adelanto",
    "manage_empleados",
    "update_empleado",
  ],
  empleado: ["view_adelantos"],
};

export function AuthProvider({ children }) {
  const [usuarios] = useState(usuariosIniciales);
  const [usuarioActual, setUsuarioActual] = useState(null);

  const permisos = useMemo(() => {
    if (!usuarioActual) {
      return new Set();
    }
    return new Set(permisosPorRol[usuarioActual.rol] ?? []);
  }, [usuarioActual]);

  const login = useCallback(
    (usuarioId, password) => {
      const usuarioSeleccionado = usuarios.find(
        (usuario) => usuario.id === usuarioId,
      );

      if (!usuarioSeleccionado) {
        setUsuarioActual(null);
        return false;
      }

      if (usuarioSeleccionado.password !== password) {
        setUsuarioActual(null);
        return false;
      }

      setUsuarioActual(usuarioSeleccionado);
      return true;
    },
    [usuarios],
  );

  const logout = useCallback(() => {
    setUsuarioActual(null);
  }, []);

  const value = useMemo(
    () => ({ usuarios, usuarioActual, permisos, login, logout }),
    [usuarios, usuarioActual, permisos, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}
