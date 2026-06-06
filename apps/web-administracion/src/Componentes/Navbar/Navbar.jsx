import { NavLink } from "react-router-dom";
import "./Navbar.css";

const rolLabel = {
  admin: "Administrador",
  empleado: "Empleado",
};

function Navbar({ usuario, permisos, onLogout }) {
  return (
    <header className="navbar">
      <div className="navbar__brand">
        <span className="navbar__logo">AD</span>
        <div>
          <p className="navbar__title">Panel de Adelantos</p>
          <p className="navbar__subtitle">Gestión de adelantos a empleados</p>
        </div>
      </div>
      <nav className="navbar__nav">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `navbar__link ${isActive ? "navbar__link--active" : ""}`
          }
        >
          Resumen
        </NavLink>
        {permisos.has("view_empleados") && (
          <NavLink
            to="/empleados"
            className={({ isActive }) =>
              `navbar__link ${isActive ? "navbar__link--active" : ""}`
            }
          >
            Empleados
          </NavLink>
        )}
        {permisos.has("view_adelantos") && (
          <NavLink
            to="/adelantos"
            className={({ isActive }) =>
              `navbar__link ${isActive ? "navbar__link--active" : ""}`
            }
          >
            Adelantos
          </NavLink>
        )}
      </nav>
      <div className="navbar__actions">
        {permisos.has("export") && (
          <button className="btn btn--ghost">Exportar</button>
        )}
        {permisos.has("create_adelanto") && (
          <button className="btn btn--primary">Nueva solicitud</button>
        )}
        <button className="btn btn--ghost" onClick={onLogout}>
          Cerrar sesión
        </button>
        <div className="navbar__user">
          <span className="navbar__avatar">
            {usuario.nombre
              .split(" ")
              .slice(0, 2)
              .map((parte) => parte[0])
              .join("")}
          </span>
          <div>
            <p className="navbar__user-name">{usuario.nombre}</p>
            <p className="navbar__user-role">
              {rolLabel[usuario.rol] ?? usuario.rol}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
