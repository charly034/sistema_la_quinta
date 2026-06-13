import React from "react";

export default function PaginaCarga({ mensaje = "Cargando..." }) {
  return (
    <div className="estado-pagina" role="status" aria-live="polite">
      <div className="spinner" />
      <p>{mensaje}</p>
    </div>
  );
}
