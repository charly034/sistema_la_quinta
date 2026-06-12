import { useQuery } from "@tanstack/react-query";
import { listarSemanas } from "../services/menus.service";
import { listarPlatos } from "../services/platos.service";
import PaginaCarga from "../components/shared/PaginaCarga";
import MensajeError from "../components/shared/MensajeError";

export default function InicioPage() {
  const semanasQ = useQuery({
    queryKey: ["dashboard", "semanas"],
    queryFn: () => listarSemanas({ limite: 5 }),
  });
  const platosQ = useQuery({
    queryKey: ["dashboard", "platos"],
    queryFn: () => listarPlatos({ pagina: 1, tamano: 1 }),
  });

  if (semanasQ.isLoading || platosQ.isLoading)
    return <PaginaCarga mensaje="Cargando tablero..." />;
  if (semanasQ.error) return <MensajeError error={semanasQ.error} />;
  if (platosQ.error) return <MensajeError error={platosQ.error} />;

  const semanas = semanasQ.data?.semanas || [];
  const semanaActual = semanas[0];

  return (
    <section className="grid-dashboard">
      <article className="kpi">
        <h3>Semana actual</h3>
        <p>{semanaActual?.fechaInicio || "Sin semana activa"}</p>
      </article>
      <article className="kpi">
        <h3>Estado de versión</h3>
        <p>{semanaActual?.versionActual?.estado || "Sin versión"}</p>
      </article>
      <article className="kpi">
        <h3>Platos activos</h3>
        <p>{platosQ.data?.total || 0}</p>
      </article>
      <article className="kpi">
        <h3>Acciones rápidas</h3>
        <div className="acciones-rapidas">
          <button className="btn btn--secondary" type="button">
            Crear próxima semana
          </button>
          <button className="btn btn--secondary" type="button">
            Duplicar semana
          </button>
          <button className="btn btn--secondary" type="button">
            Generar propuestas
          </button>
          <button className="btn btn--secondary" type="button">
            Crear plato
          </button>
        </div>
      </article>
    </section>
  );
}
