export default function PaginaVacia({
  titulo = "Sin resultados",
  descripcion = "No hay datos para mostrar con los filtros actuales.",
  accion,
}) {
  return (
    <section className="estado-pagina estado-pagina--vacia">
      <h3>{titulo}</h3>
      <p>{descripcion}</p>
      {accion || null}
    </section>
  );
}
