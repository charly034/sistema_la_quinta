import { NavLink } from "react-router-dom";
import { itemsNavegacion } from "./navegacion";
import { tieneAlgunoDeLosPermisos } from "../../utils/permisos";

export default function Sidebar({ usuario, colapsada }) {
  return (
    <aside className={`sidebar ${colapsada ? "sidebar--colapsada" : ""}`}>
      <div className="sidebar__marca">
        <strong>La Quinta</strong>
        <small>Panel Menús</small>
      </div>
      <nav aria-label="Navegación principal">
        {itemsNavegacion
          .filter(
            (item) =>
              item.permisos.length === 0 ||
              tieneAlgunoDeLosPermisos(usuario, item.permisos),
          )
          .map((item) => {
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `sidebar__link ${isActive ? "sidebar__link--activo" : ""}`
                }
              >
                <span aria-hidden="true">{item.icono}</span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
      </nav>
    </aside>
  );
}
