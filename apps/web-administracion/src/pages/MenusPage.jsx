import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { listarSemanas } from "../services/menus.service";
import {
  listarMarcas,
  listarCanales,
  listarEmpresas,
} from "../services/admin.service";
import PaginaCarga from "../components/shared/PaginaCarga";
import MensajeError from "../components/shared/MensajeError";
import PaginaVacia from "../components/shared/PaginaVacia";
import TablaPaginada from "../components/shared/TablaPaginada";
import BarraFiltros from "../components/shared/BarraFiltros";
import {
  SelectorMarca,
  SelectorCanal,
  SelectorEmpresa,
  SelectorEstado,
} from "../components/shared/Selectores";

export default function MenusPage() {
  const navigate = useNavigate();
  const [marcaId, setMarcaId] = useState();
  const [canalId, setCanalId] = useState();
  const [empresaId, setEmpresaId] = useState();
  const [estado, setEstado] = useState();

  const filtros = useMemo(
    () => ({ pagina: 1, limite: 20, marcaId, canalId, empresaId, estado }),
    [marcaId, canalId, empresaId, estado],
  );

  const semanasQ = useQuery({
    queryKey: ["semanas", filtros],
    queryFn: () => listarSemanas(filtros),
  });
  const marcasQ = useQuery({
    queryKey: ["marcas-base"],
    queryFn: () => listarMarcas({ pagina: 1, tamano: 100 }),
  });
  const canalesQ = useQuery({
    queryKey: ["canales-base"],
    queryFn: () => listarCanales({ pagina: 1, tamano: 100 }),
  });
  const empresasQ = useQuery({
    queryKey: ["empresas-base"],
    queryFn: () => listarEmpresas({ pagina: 1, tamano: 100 }),
  });

  if (
    semanasQ.isLoading ||
    marcasQ.isLoading ||
    canalesQ.isLoading ||
    empresasQ.isLoading
  ) {
    return <PaginaCarga mensaje="Cargando semanas..." />;
  }
  if (semanasQ.error) return <MensajeError error={semanasQ.error} />;

  const semanas = semanasQ.data?.semanas || [];

  return (
    <section className="seccion-admin">
      <header className="seccion-admin__header">
        <h2>Menús semanales</h2>
      </header>
      <BarraFiltros>
        <SelectorMarca
          marcas={marcasQ.data?.items || marcasQ.data?.marcas || []}
          value={marcaId}
          onChange={setMarcaId}
        />
        <SelectorCanal
          canales={canalesQ.data?.items || canalesQ.data?.canales || []}
          value={canalId}
          onChange={setCanalId}
        />
        <SelectorEmpresa
          empresas={empresasQ.data?.items || empresasQ.data?.empresas || []}
          value={empresaId}
          onChange={setEmpresaId}
        />
        <SelectorEstado
          estados={[
            "BORRADOR",
            "PROPUESTO",
            "APROBADO",
            "PUBLICADO",
            "FINALIZADO",
            "CANCELADO",
          ]}
          value={estado}
          onChange={setEstado}
        />
      </BarraFiltros>

      {semanas.length === 0 ? (
        <PaginaVacia
          titulo="Sin semanas"
          descripcion="No hay semanas para los filtros seleccionados."
        />
      ) : (
        <TablaPaginada
          columnas={[
            { key: "fechaInicio", label: "Fecha" },
            { key: "marcaNombre", label: "Marca" },
            { key: "canalNombre", label: "Canal" },
            { key: "empresaNombre", label: "Empresa" },
            { key: "estadoActual", label: "Estado actual" },
            { key: "estadoPublicado", label: "Estado publicado" },
          ]}
          filas={semanas}
          renderAcciones={(fila) => (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() =>
                navigate(
                  `/menus/${fila.id}/versiones/${fila.versionActual?.id || fila.versionId || ""}`,
                )
              }
            >
              Ver / Editar
            </button>
          )}
        />
      )}
    </section>
  );
}
