export default function ModalConfirmacion({
  abierto,
  titulo,
  descripcion,
  onConfirmar,
  onCancelar,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
}) {
  if (!abierto) return null;

  return (
    <div
      className="modal-fondo"
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
    >
      <div className="modal-contenido">
        <h3>{titulo}</h3>
        <p>{descripcion}</p>
        <div className="modal-acciones">
          <button type="button" className="btn btn--ghost" onClick={onCancelar}>
            {textoCancelar}
          </button>
          <button
            type="button"
            className="btn btn--danger"
            onClick={onConfirmar}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
