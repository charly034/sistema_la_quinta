import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  crearRegla,
  listarReglas,
  cambiarEstadoRegla,
} from "../services/reglas.service";
import PaginaCarga from "../components/shared/PaginaCarga";
import MensajeError from "../components/shared/MensajeError";
import TablaPaginada from "../components/shared/TablaPaginada";

export default function ReglasPage() {
  const queryClient = useQueryClient();
  const tipo = "";
  const reglasQ = useQuery({
    queryKey: ["reglas", tipo],
    queryFn: () => listarReglas(tipo ? { tipo } : {}),
  });
  const form = useForm({
    defaultValues: {
      nombre: "",
      tipo: "DIVERSIDAD_CATEGORIAS",
      naturaleza: "OBLIGATORIA",
    },
  });

  const crearM = useMutation({
    mutationFn: crearRegla,
    onSuccess: () => {
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["reglas"] });
    },
  });

  const estadoM = useMutation({
    mutationFn: ({ id, activo }) => cambiarEstadoRegla(id, { activo }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reglas"] }),
  });

  if (reglasQ.isLoading) return <PaginaCarga mensaje="Cargando reglas..." />;
  if (reglasQ.error) return <MensajeError error={reglasQ.error} />;

  const reglas = reglasQ.data?.items || reglasQ.data?.reglas || [];

  return (
    <section className="seccion-admin">
      <header className="seccion-admin__header">
        <h2>Reglas</h2>
      </header>

      <form
        className="form-inline"
        onSubmit={form.handleSubmit((values) => crearM.mutate(values))}
      >
        <input
          placeholder="Nombre"
          {...form.register("nombre", { required: true })}
        />
        <input
          placeholder="Tipo"
          {...form.register("tipo", { required: true })}
        />
        <input
          placeholder="Naturaleza"
          {...form.register("naturaleza", { required: true })}
        />
        <button type="submit" className="btn btn--primary">
          Crear regla
        </button>
      </form>

      <TablaPaginada
        columnas={[
          { key: "nombre", label: "Nombre" },
          { key: "tipo", label: "Tipo" },
          { key: "naturaleza", label: "Naturaleza" },
          { key: "prioridad", label: "Prioridad" },
          { key: "peso", label: "Peso" },
        ]}
        filas={reglas}
        renderAcciones={(fila) => (
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() =>
              estadoM.mutate({ id: fila.id, activo: !fila.activo })
            }
          >
            {fila.activo ? "Desactivar" : "Activar"}
          </button>
        )}
      />
    </section>
  );
}
