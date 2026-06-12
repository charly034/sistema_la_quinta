import { useQuery } from "@tanstack/react-query";
import TablaPaginada from "../components/shared/TablaPaginada";
import PaginaCarga from "../components/shared/PaginaCarga";
import MensajeError from "../components/shared/MensajeError";

export default function AdminBasePage({ titulo, queryKey, queryFn, columnas }) {
  const q = useQuery({ queryKey, queryFn });
  if (q.isLoading)
    return <PaginaCarga mensaje={`Cargando ${titulo.toLowerCase()}...`} />;
  if (q.error) return <MensajeError error={q.error} />;

  const filas =
    q.data?.items ||
    q.data?.usuarios ||
    q.data?.roles ||
    q.data?.marcas ||
    q.data?.canales ||
    q.data?.empresas ||
    [];

  return (
    <section className="seccion-admin">
      <header className="seccion-admin__header">
        <h2>{titulo}</h2>
      </header>
      <TablaPaginada columnas={columnas} filas={filas} />
    </section>
  );
}
