import React from "react";

export default function MensajeError({
  error,
  titulo = "No pudimos cargar esta vista.",
}) {
  return (
    <section className="estado-pagina estado-pagina--error" role="alert">
      <h3>{titulo}</h3>
      <p>{error?.message || "Error desconocido."}</p>
      {error?.code ? <small>Código: {error.code}</small> : null}
    </section>
  );
}
