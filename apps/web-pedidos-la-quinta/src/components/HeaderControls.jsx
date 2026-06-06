export function HeaderControls({
  soloHoy,
  setSoloHoy,
  autoRefresh,
  setAutoRefresh,
  hideFinalizados,
  setHideFinalizados,
  hoyLabel,
  countShown,
  countTotalText,
  onRefresh,
}) {
  return (
    <header className="header">
      <h1>La Quinta · Pedidos</h1>

      <div className="controls">
        <button onClick={onRefresh}>Refrescar</button>

        <label className="toggle">
          <input
            type="checkbox"
            checked={soloHoy}
            onChange={(e) => setSoloHoy(e.target.checked)}
          />
          Solo hoy {soloHoy ? `(${hoyLabel})` : ""}
        </label>

        <label className="toggle">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          Auto (15s)
        </label>

        <label className="toggle">
          <input
            type="checkbox"
            checked={!hideFinalizados}
            onChange={(e) => setHideFinalizados(!e.target.checked)}
          />
          Mostrar finalizados
        </label>

        <span className="counter">
          Mostrando <b>{countShown}</b> / {countTotalText}
        </span>
      </div>
    </header>
  );
}
