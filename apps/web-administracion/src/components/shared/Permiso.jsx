import { Navigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { tieneAlgunoDeLosPermisos } from "../../utils/permisos";

export default function Permiso({
  permisos,
  children,
  fallback = null,
  redirigir = false,
}) {
  const { usuario } = useAuth();
  const autorizado = tieneAlgunoDeLosPermisos(usuario, permisos);

  if (autorizado) return children;
  if (redirigir) return <Navigate to="/inicio" replace />;
  return fallback;
}
