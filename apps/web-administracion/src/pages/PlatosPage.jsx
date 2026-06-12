import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  crearPlato,
  listarPlatos,
  actualizarEstadoPlato,
  actualizarFavoritoPlato,
} from "../services/platos.service";
import { listarMarcas } from "../services/admin.service";
import PaginaCarga from "../components/shared/PaginaCarga";
import MensajeError from "../components/shared/MensajeError";
import PaginaVacia from "../components/shared/PaginaVacia";
import TablaPaginada from "../components/shared/TablaPaginada";
import BarraFiltros from "../components/shared/BarraFiltros";
import CampoBusqueda from "../components/shared/CampoBusqueda";
import { SelectorMarca, SelectorEstado } from "../components/shared/Selectores";
import EstadoBadge from "../components/shared/EstadoBadge";

export default function PlatosPage() {
  const queryClient = useQueryClient();
  const [buscar, setBuscar] = useState("");
  const [estado, setEstado] = useState();
  const [marcaId, setMarcaId] = useState();

  const filtros = useMemo(
    () => ({ pagina: 1, tamano: 30, buscar, estado, marcaId }),
    [buscar, estado, marcaId],
  );

  const platosQ = useQuery({
    queryKey: ["platos", filtros],
    queryFn: () => listarPlatos(filtros),
  });
  const marcasQ = useQuery({
    queryKey: ["marcas-selector"],
    queryFn: () => listarMarcas({ pagina: 1, tamano: 100 }),
  });

  const form = useForm({
    defaultValues: { marcaId: "", tipo: "PRINCIPAL", nombre: "" },
  });

  const crearM = useMutation({
    mutationFn: crearPlato,
    onSuccess: () => {
      form.reset({ marcaId: "", tipo: "PRINCIPAL", nombre: "" });
      queryClient.invalidateQueries({ queryKey: ["platos"] });
    },
  });

  const estadoM = useMutation({
    mutationFn: ({ id, estado }) => actualizarEstadoPlato(id, { estado }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["platos"] }),
  });

  const favM = useMutation({
    mutationFn: ({ id, favorito }) => actualizarFavoritoPlato(id, { favorito }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["platos"] }),
  });

  if (platosQ.isLoading || marcasQ.isLoading)
    return <PaginaCarga mensaje="Cargando platos..." />;
  if (platosQ.error) return <MensajeError error={platosQ.error} />;

  const filas = platosQ.data?.items || platosQ.data?.platos || [];

  return (
    <section className="seccion-admin">
      <header className="seccion-admin__header">
        <h2>Catálogo de platos</h2>
        <form
          className="form-inline"
          onSubmit={form.handleSubmit((values) => crearM.mutate(values))}
        >
          <input
            placeholder="Marca ID"
            {...form.register("marcaId", { required: true })}
          />
          <select {...form.register("tipo")}>
            <option value="PRINCIPAL">PRINCIPAL</option>
            <option value="GUARNICION">GUARNICION</option>
            <option value="POSTRE">POSTRE</option>
            <option value="ENSALADA">ENSALADA</option>
          </select>
          <input
            placeholder="Nombre"
            {...form.register("nombre", { required: true })}
          />
          <button
            className="btn btn--primary"
            type="submit"
            disabled={crearM.isPending}
          >
            {crearM.isPending ? "Guardando..." : "Crear plato"}
          </button>
        </form>
      </header>

      <BarraFiltros>
        <CampoBusqueda
          value={buscar}
          onChange={setBuscar}
          placeholder="Buscar plato"
        />
        <SelectorMarca
          marcas={marcasQ.data?.items || marcasQ.data?.marcas || []}
          value={marcaId}
          onChange={setMarcaId}
        />
        <SelectorEstado
          estados={["ACTIVO", "INACTIVO", "ARCHIVADO"]}
          value={estado}
          onChange={setEstado}
        />
      </BarraFiltros>

      {filas.length === 0 ? (
        <PaginaVacia
          titulo="Sin platos"
          descripcion="No hay platos para los filtros seleccionados."
        />
      ) : (
        <TablaPaginada
          columnas={[
            { key: "nombre", label: "Nombre" },
            { key: "tipo", label: "Tipo" },
            {
              key: "estado",
              label: "Estado",
              render: (value) => <EstadoBadge estado={value} />,
            },
            {
              key: "favorito",
              label: "Favorito",
              render: (value) => (value ? "Sí" : "No"),
            },
          ]}
          filas={filas}
          renderAcciones={(fila) => (
            <div className="acciones-fila">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() =>
                  favM.mutate({ id: fila.id, favorito: !fila.favorito })
                }
              >
                {fila.favorito ? "Quitar favorito" : "Favorito"}
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() =>
                  estadoM.mutate({
                    id: fila.id,
                    estado: fila.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO",
                  })
                }
              >
                Cambiar estado
              </button>
            </div>
          )}
        />
      )}
    </section>
  );
}
