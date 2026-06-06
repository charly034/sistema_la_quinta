import { getBadgeClass } from "../utils/pedido";
import { buildWhatsAppUrl } from "../utils/whatsapp";
import { printTicket } from "../printing/printTicket";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import "./PedidoCard.css";

function buildWhatsAppMessage(p) {
  const nombre = String(p?.nombre ?? "").trim();
  const telefono = String(p?.telefono ?? "").trim();
  const direccion = String(p?.direccion ?? "").trim();
  const productos = String(p?.productos ?? "").trim();
  const modalidad = String(p?.modalidad ?? "").trim();

  const lines = [
    `Hola *${nombre}* 👋`,
    ``,
    `Te confirmamos tu pedido en *La Quinta Comidas* 🥘`,
    ``,
    `📅 *Fecha:* ${p?.fecha ?? ""}`,
    `👤 *Cliente:* ${nombre}`,
    `📞 *Tel:* ${telefono}`,
    direccion ? `📍 *Dirección:* ${direccion}` : null,
    ``,
    `🍽️ *Pedido:*`,
    productos || "-",
    ``,
    `🚚 *Modalidad:* ${modalidad}`,
    ``,
    `¡Muchas gracias por tu pedido! 🙌`,
    `Cualquier cosa nos escribís por acá 😊`,
  ];

  return lines.filter(Boolean).join("\n");
}

export function PedidoCard({ pedido, onUpdateStatus, onStopAlarm }) {
  const badgeClass = getBadgeClass(pedido?.modalidad);

  const waUrl = buildWhatsAppUrl({
    telefono: pedido?.telefono,
    text: buildWhatsAppMessage(pedido),
  });

  const canWhatsApp = Boolean(waUrl);

  function openWhatsApp() {
    if (!waUrl) {
      alert("Teléfono inválido para WhatsApp. Revisá el formato.");
      return;
    }
    onStopAlarm?.();
    window.open(waUrl, "_blank", "noopener,noreferrer");
  }

  function onPrintClick() {
    onStopAlarm?.();
    console.log("CLICK IMPRIMIR", pedido?.id); // debug
    printTicket(pedido);
  }

  function onMarkPrepared() {
    onStopAlarm?.();
    onUpdateStatus?.(pedido.id, "preparado");
  }

  function onMarkFinalized() {
    Swal.fire({
      title: "¿Finalizar pedido?",
      text: `¿Confirmás que el pedido de ${pedido.nombre} está listo para entrega?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, finalizar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          onStopAlarm?.();
          await onUpdateStatus?.(pedido.id, "finalizado");
          Swal.fire({
            title: "¡Pedido finalizado!",
            text: "El pedido ha sido marcado como completado.",
            icon: "success",
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: "top-end",
          });
        } catch (error) {
          console.error("Error finalizando pedido:", error);
          Swal.fire({
            title: "Error",
            text: "No se pudo finalizar el pedido. Intentalo de nuevo.",
            icon: "error",
          });
        }
      }
    });
  }

  const currentEstado = pedido?.estado || "pendiente";
  const isFinalized = currentEstado === "finalizado";

  return (
    <div className="card">
      {/* Header simplificado */}
      <div className="cardHeader">
        <div className="headerMain">
          <div className="cardTime">🕒 {pedido.hora}</div>
          <div className="cardName">{pedido.nombre}</div>
          <span className={`badge ${badgeClass}`}>{pedido.modalidad}</span>
        </div>
      </div>

      {/* Estado y acción principal */}
      {!isFinalized && (
        <div className="statusSection">
          <div className="statusDisplay">
            <span className={`statusBadge status-${currentEstado}`}>
              {currentEstado === "pendiente" ? "🟡 PENDIENTE" : "🔵 PREPARADO"}
            </span>
          </div>
          <div className="primaryAction">
            {currentEstado === "pendiente" ? (
              <button onClick={onMarkPrepared} className="btnPrimary">
                ✅ Marcar preparado
              </button>
            ) : (
              <button onClick={onMarkFinalized} className="btnPrimary">
                🚚 Finalizar pedido
              </button>
            )}
          </div>
        </div>
      )}

      {/* Datos del pedido */}
      <div className="cardBody">
        <div className="dataSection">
          <div className="dataRow">
            <span className="dataLabel">📞</span>
            <span className="dataValue mono">{pedido.telefono}</span>
          </div>

          {pedido.direccion && (
            <div className="dataRow">
              <span className="dataLabel">📍</span>
              <span className="dataValue">{pedido.direccion}</span>
            </div>
          )}
        </div>

        {/* Productos mejorados */}
        <div className="productsSection">
          <div className="productsList">
            {pedido.productos.split("\n").map((line, index) => (
              <div key={index} className="productItem">
                {line.trim()}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Acciones secundarias */}
      <div className="secondaryActions">
        <button
          onClick={onPrintClick}
          title="Imprimir ticket (80mm)"
          className="btnSecondary"
        >
          🖨️ Imprimir
        </button>

        <button
          onClick={openWhatsApp}
          disabled={!canWhatsApp}
          title={
            canWhatsApp
              ? "Abrir WhatsApp del cliente"
              : "Teléfono inválido para WhatsApp"
          }
          className={`btnSecondary ${!canWhatsApp ? "disabled" : ""}`}
        >
          💬 WhatsApp
        </button>
      </div>
    </div>
  );
}
