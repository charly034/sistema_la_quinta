import { useState, useEffect } from "react";
import "./App.css";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

import { usePedidos } from "./hooks/usePedidos";
import { useFilteredPedidos } from "./hooks/useFilteredPedidos";
import { todayLabelEsAR } from "./utils/dates";
import { printTicket } from "./printing/printTicket";
import { ALARM_SETTINGS } from "./config/alarmSettings";

import { HeaderControls } from "./components/HeaderControls";
import { PedidosList } from "./components/PedidosList";
import { Footer } from "./components/Footer";

export default function App() {
  const [soloHoy, setSoloHoy] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [hideFinalizados, setHideFinalizados] = useState(true);

  const {
    pedidos,
    loading,
    error,
    refresh,
    updateStatus,
    stopAlarmSound,
    newPedidoForAlert,
    clearNewPedidoAlert,
  } = usePedidos({
    autoRefresh,
    pollingIntervalMs: 15000,
    alarmType: ALARM_SETTINGS.type,
    alarmIntervalMs: ALARM_SETTINGS.intervalMs,
  });

  const { pedidosFiltrados, countTotalText } = useFilteredPedidos(
    pedidos,
    soloHoy,
    hideFinalizados,
  );

  const hoyLabel = todayLabelEsAR();

  // Mostrar alerta cuando llega un pedido nuevo
  useEffect(() => {
    if (!newPedidoForAlert) return;

    const pedido = newPedidoForAlert;

    Swal.fire({
      title: "🔔 ¡Nuevo Pedido!",
      html: `
        <div style="text-align: left; font-size: 16px;">
          <div style="margin: 12px 0;"><strong>👤 Cliente:</strong> ${pedido.nombre}</div>
          <div style="margin: 12px 0;"><strong>🚚 Modalidad:</strong> ${pedido.modalidad}</div>
        </div>
      `,
      icon: "info",
      showCancelButton: true,
      cancelButtonText: "Aceptar ✅",
      confirmButtonText: "Imprimir 🖨️",
      confirmButtonColor: "#f59e0b",
      cancelButtonColor: "#10b981",
      allowOutsideClick: false,
      allowEscapeKey: false,
    }).then((result) => {
      stopAlarmSound();
      clearNewPedidoAlert();

      if (result.isConfirmed) {
        // Si presionó Imprimir
        printTicket(pedido);
      }
      // Si presionó Aceptar o cerró, solo detiene la alarma
    });
  }, [newPedidoForAlert, stopAlarmSound, clearNewPedidoAlert]);

  return (
    <div className="page">
      {" "}
      <div className="logoContainer">
        <img src="/logo.jpg" alt="La Quinta Comidas" className="logoHeader" />
      </div>{" "}
      <HeaderControls
        soloHoy={soloHoy}
        setSoloHoy={setSoloHoy}
        autoRefresh={autoRefresh}
        setAutoRefresh={setAutoRefresh}
        hideFinalizados={hideFinalizados}
        setHideFinalizados={setHideFinalizados}
        hoyLabel={hoyLabel}
        countShown={pedidosFiltrados.length}
        countTotalText={countTotalText}
        onRefresh={() => refresh()}
      />
      <main className="content">
        <PedidosList
          pedidosFiltrados={pedidosFiltrados}
          loading={loading}
          error={error}
          updateStatus={updateStatus}
          stopAlarmSound={stopAlarmSound}
          soloHoy={soloHoy}
        />
      </main>
      <Footer />
    </div>
  );
}
