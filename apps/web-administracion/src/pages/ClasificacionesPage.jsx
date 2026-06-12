import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listarClasificacion } from "../services/platos.service";
import TablaPaginada from "../components/shared/TablaPaginada";
import PaginaCarga from "../components/shared/PaginaCarga";
import MensajeError from "../components/shared/MensajeError";

const RECURSOS = [
  { key: "categorias", label: "Categorías" },
  { key: "proteinas", label: "Proteínas" },
  { key: "etiquetas", label: "Etiquetas" },
  { key: "ingredientes", label: "Ingredientes" },
  { key: "alergenos", label: "Alérgenos" },
  {
    key: "caracteristicas-alimentarias",
    label: "Características alimentarias",
  },
];

export default function ClasificacionesPage() {
  const [recurso, setRecurso] = useState("categorias");

  const q = useQuery({
    queryKey: ["clasificaciones", recurso],
    queryFn: () => listarClasificacion(recurso, { pagina: 1, tamano: 100 }),
  });

  const tabs = useMemo(
    () =>
      RECURSOS.map((item) => (
        <button
          key={item.key}
          type="button"
          className={`btn ${recurso === item.key ? "btn--primary" : "btn--ghost"}`}
          onClick={() => setRecurso(item.key)}
        >
          {item.label}
        </button>
      )),
    [recurso],
  );

  if (q.isLoading) return <PaginaCarga mensaje="Cargando clasificaciones..." />;
  if (q.error) return <MensajeError error={q.error} />;

  const filas = q.data?.items || [];

  return (
    <section className="seccion-admin">
      <header className="seccion-admin__header">
        <h2>Clasificaciones</h2>
        <div className="tabs-inline">{tabs}</div>
      </header>
      <TablaPaginada
        columnas={[
          { key: "codigo", label: "Código" },
          { key: "nombre", label: "Nombre" },
          { key: "estado", label: "Estado" },
          { key: "marcaNombre", label: "Marca" },
        ]}
        filas={filas}
      />
    </section>
  );
}
