import { useEffect, useState, useRef } from "react";
import { fetchPedidos, updatePedidoStatus } from "../services/pedidosApi";
import { useAlarmSound } from "./useAlarmSound";

export function usePedidos({
  autoRefresh = true,
  pollingIntervalMs = 15000,
  alarmType = "urgent",
  alarmIntervalMs = 600,
} = {}) {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [alarmActive, setAlarmActive] = useState(false);
  const [newPedidoForAlert, setNewPedidoForAlert] = useState(null);
  const prevPedidosRef = useRef([]);
  const { startAlarm, stopAlarm } = useAlarmSound({
    alarmType,
    intervalMs: alarmIntervalMs,
  });

  async function refresh({ signal } = {}) {
    try {
      setError("");
      const data = await fetchPedidos({ signal });
      const newPedidos = Array.isArray(data) ? data : [];

      // Detectar pedidos nuevos comparando con los anteriores
      if (prevPedidosRef.current.length > 0) {
        const prevIds = new Set(prevPedidosRef.current.map((p) => p.id));
        const newIds = new Set(newPedidos.map((p) => p.id));

        // Hay nuevos pedidos si hay IDs que no estaban antes
        const newPedidosList = Array.from(newIds).filter(
          (id) => !prevIds.has(id),
        );

        if (newPedidosList.length > 0) {
          // Obtener el primer pedido nuevo
          const firstNewPedidoId = newPedidosList[0];
          const firstNewPedido = newPedidos.find(
            (p) => p.id === firstNewPedidoId,
          );
          setNewPedidoForAlert(firstNewPedido);

          startAlarm();
          setAlarmActive(true);
        }
      }

      prevPedidosRef.current = newPedidos;
      setPedidos(newPedidos);
    } catch (e) {
      if (e?.name !== "AbortError") {
        console.error("fetchPedidos error:", e);
        setError(e?.message || "No se pudieron cargar los pedidos.");
      }
    } finally {
      setLoading(false);
    }
  }

  // initial load
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    refresh({ signal: controller.signal });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    let controller = new AbortController();

    const tick = () => {
      controller.abort();
      controller = new AbortController();
      refresh({ signal: controller.signal });
    };

    const id = setInterval(tick, pollingIntervalMs);

    return () => {
      controller.abort();
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, pollingIntervalMs]);

  async function updateStatus(id, newEstado) {
    try {
      await updatePedidoStatus(id, newEstado);
      setPedidos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, estado: newEstado } : p)),
      );
    } catch (e) {
      console.error("updatePedidoStatus error:", e);
      setError(e?.message || "No se pudo actualizar el estado del pedido.");
    }
  }

  function stopAlarmSound() {
    stopAlarm();
    setAlarmActive(false);
  }

  function clearNewPedidoAlert() {
    setNewPedidoForAlert(null);
  }

  return {
    pedidos,
    loading,
    error,
    refresh,
    updateStatus,
    stopAlarmSound,
    alarmActive,
    newPedidoForAlert,
    clearNewPedidoAlert,
  };
}
