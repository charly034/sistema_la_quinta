import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  crearPerfilReglas,
  listarPerfilesReglas,
} from "../services/perfiles-reglas.service";
import TablaPaginada from "../components/shared/TablaPaginada";
import PaginaCarga from "../components/shared/PaginaCarga";
import MensajeError from "../components/shared/MensajeError";

export default function PerfilesReglasPage() {
  const queryClient = useQueryClient();
  const perfilesQ = useQuery({
    queryKey: ["perfiles-reglas"],
    queryFn: () => listarPerfilesReglas({}),
  });
  const form = useForm({ defaultValues: { nombre: "", descripcion: "" } });

  const crearM = useMutation({
    mutationFn: crearPerfilReglas,
    onSuccess: () => {
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["perfiles-reglas"] });
    },
  });

  if (perfilesQ.isLoading)
    return <PaginaCarga mensaje="Cargando perfiles..." />;
  if (perfilesQ.error) return <MensajeError error={perfilesQ.error} />;

  const perfiles = perfilesQ.data?.items || perfilesQ.data?.perfiles || [];

  return (
    <section className="seccion-admin">
      <header className="seccion-admin__header">
        <h2>Perfiles de reglas</h2>
      </header>
      <form
        className="form-inline"
        onSubmit={form.handleSubmit((values) => crearM.mutate(values))}
      >
        <input
          placeholder="Nombre"
          {...form.register("nombre", { required: true })}
        />
        <input placeholder="Descripción" {...form.register("descripcion")} />
        <button type="submit" className="btn btn--primary">
          Crear perfil
        </button>
      </form>
      <TablaPaginada
        columnas={[
          { key: "nombre", label: "Perfil" },
          { key: "estado", label: "Estado" },
          { key: "reglasActivas", label: "Reglas activas" },
        ]}
        filas={perfiles}
      />
    </section>
  );
}
