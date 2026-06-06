import { useMemo } from "react";
import { normalizeToYMD, todayYMD_Mendoza } from "../utils/dates";

export function useFilteredPedidos(pedidos, soloHoy, hideFinalizados = true) {
  const hoyYMD = todayYMD_Mendoza();

  const pedidosFiltrados = useMemo(() => {
    let list = Array.isArray(pedidos) ? pedidos : [];
    if (hideFinalizados) {
      list = list.filter((p) => p.estado !== "finalizado");
    }
    if (!soloHoy) return list;
    return list.filter((p) => normalizeToYMD(p.fecha) === hoyYMD);
  }, [pedidos, soloHoy, hoyYMD, hideFinalizados]);

  const totalHoy = useMemo(() => {
    const list = Array.isArray(pedidos) ? pedidos : [];
    return list.filter((p) => normalizeToYMD(p.fecha) === hoyYMD).length;
  }, [pedidos, hoyYMD]);

  const countTotalText = soloHoy
    ? `hoy (${totalHoy})`
    : `total (${Array.isArray(pedidos) ? pedidos.length : 0})`;

  return { pedidosFiltrados, totalHoy, countTotalText };
}
