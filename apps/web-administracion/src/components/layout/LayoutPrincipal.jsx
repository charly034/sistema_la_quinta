import { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import Sidebar from "./Sidebar";
import Header from "./Header";
import PaginaCarga from "../shared/PaginaCarga";

export default function LayoutPrincipal() {
  const { usuario, cargandoPerfil, logout } = useAuth();
  const [colapsada, setColapsada] = useState(false);

  if (cargandoPerfil) {
    return <PaginaCarga mensaje="Verificando sesión..." />;
  }

  if (!usuario) {
    return <Navigate to="/iniciar-sesion" replace />;
  }

  return (
    <div className="layout-admin">
      <Sidebar usuario={usuario} colapsada={colapsada} />
      <div className="layout-admin__contenido">
        <Header
          usuario={usuario}
          onLogout={logout}
          onToggleSidebar={() => setColapsada((prev) => !prev)}
        />
        <main className="contenido-principal">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
