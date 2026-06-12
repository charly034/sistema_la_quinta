import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { generarPropuestaPersonalizada } from "../services/propuestas.service";
import MensajeError from "../components/shared/MensajeError";

export default function PropuestasPage() {
  const [resultado, setResultado] = useState(null);
  const [errorLocal, setErrorLocal] = useState(null);

  const generarM = useMutation({
    mutationFn: ({ semanaId, versionId, payload }) =>
      generarPropuestaPersonalizada(semanaId, versionId, payload),
    onSuccess: setResultado,
    onError: setErrorLocal,
  });

  function onSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const semanaId = form.get("semanaId");
    const versionId = form.get("versionId");
    const semilla = Number(form.get("semilla"));

    generarM.mutate({
      semanaId,
      versionId,
      payload: {
        semilla,
        respetarPosicionesExistentes: true,
        soloCompletarVacias: false,
        reemplazarNoBloqueadas: true,
      },
    });
  }

  return (
    <section className="seccion-admin">
      <header className="seccion-admin__header">
        <h2>Generación de propuestas</h2>
      </header>

      <form className="form-inline" onSubmit={onSubmit}>
        <input name="semanaId" placeholder="Semana ID" required />
        <input name="versionId" placeholder="Versión ID" required />
        <input
          name="semilla"
          placeholder="Semilla"
          type="number"
          defaultValue={1234}
        />
        <button
          type="submit"
          className="btn btn--primary"
          disabled={generarM.isPending}
        >
          {generarM.isPending ? "Generando..." : "Generar personalizada"}
        </button>
      </form>

      <p>Generación automática por reglas e historial</p>

      {errorLocal ? (
        <MensajeError
          error={errorLocal}
          titulo="No se pudo generar propuesta"
        />
      ) : null}
      {resultado ? (
        <pre className="codigo-panel">{JSON.stringify(resultado, null, 2)}</pre>
      ) : null}
    </section>
  );
}
