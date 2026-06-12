import { useLocation } from "react-router-dom";

function tituloRuta(pathname) {
  const mapa = {
    "/inicio": "Inicio",
    "/menus": "Menús semanales",
    "/platos": "Platos",
    "/clasificaciones": "Clasificaciones",
    "/reglas": "Reglas",
    "/perfiles-reglas": "Perfiles de reglas",
    "/propuestas": "Propuestas",
    "/empresas": "Empresas",
    "/marcas-canales": "Marcas y canales",
    "/usuarios-roles": "Usuarios y roles",
    "/auditoria": "Auditoría",
    "/configuracion": "Configuración",
  };
  return mapa[pathname] || "Panel administrativo";
}

export default function Header({ usuario, onLogout, onToggleSidebar }) {
  const location = useLocation();

  return (
    <header className="encabezado">
      <button
        type="button"
        className="btn btn--ghost"
        onClick={onToggleSidebar}
        aria-label="Colapsar barra lateral"
      >
        ≡
      </button>
      <div>
        <p className="breadcrumbs">
          Sistema de menús / {tituloRuta(location.pathname)}
        </p>
        <h1>{tituloRuta(location.pathname)}</h1>
      </div>
      <div className="encabezado__usuario">
        <span>{usuario?.nombre || "Usuario"}</span>
        <button type="button" className="btn btn--secondary" onClick={onLogout}>
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
