import { PedidoCard } from "./PedidoCard";

export function PedidosList({
  pedidosFiltrados,
  loading,
  error,
  updateStatus,
  stopAlarmSound,
  soloHoy,
}) {
  if (error) {
    return <div className="error">{error}</div>;
  }

  if (loading) {
    return <div className="loading">Cargando…</div>;
  }

  return (
    <div className="list">
      {pedidosFiltrados.map((p) => (
        <PedidoCard
          key={p.id}
          pedido={p}
          onUpdateStatus={updateStatus}
          onStopAlarm={stopAlarmSound}
        />
      ))}

      {pedidosFiltrados.length === 0 && (
        <div className="loading">
          No hay pedidos para mostrar.
          {soloHoy && (
            <div style={{ marginTop: 6, color: "#6b7280" }}>
              Tip: desactivá "Solo hoy" para ver históricos.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
