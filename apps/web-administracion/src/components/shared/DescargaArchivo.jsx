export default function DescargaArchivo({
  descargando,
  onDescargar,
  texto = "Descargar",
}) {
  return (
    <button
      type="button"
      className="btn btn--secondary"
      onClick={onDescargar}
      disabled={descargando}
    >
      {descargando ? "Descargando..." : texto}
    </button>
  );
}
