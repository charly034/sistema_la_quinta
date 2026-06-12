export default function TablaPaginada({
  columnas = [],
  filas = [],
  renderAcciones,
  onFilaClick,
}) {
  return (
    <div className="tabla-wrap" role="region" aria-label="Tabla de resultados">
      <table className="tabla-admin">
        <thead>
          <tr>
            {columnas.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
            {renderAcciones ? <th>Acciones</th> : null}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr
              key={fila.id || JSON.stringify(fila)}
              tabIndex={0}
              onClick={() => onFilaClick?.(fila)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onFilaClick?.(fila);
              }}
            >
              {columnas.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(fila[col.key], fila) : fila[col.key]}
                </td>
              ))}
              {renderAcciones ? <td>{renderAcciones(fila)}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
