import { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { buildTicket80mmHtml } from "./ticket80mm";

export function useTicketPrint() {
  const ticketRef = useRef(null);
  const [printPedido, setPrintPedido] = useState(null);

  const doPrint = useReactToPrint({
    content: () => ticketRef.current,
    documentTitle: printPedido?.id ? `Ticket_${printPedido.id}` : "Ticket",
    onAfterPrint: () => setPrintPedido(null),
    removeAfterPrint: true,
  });

  async function printTicket(pedido) {
    // Renderizamos el ticket “fuera de pantalla” y luego imprimimos
    // (no abrimos pestañas adicionales)
    setPrintPedido(pedido);
    await new Promise((r) => setTimeout(r, 50));
    doPrint();
  }

  // componente a renderizar (en App o donde prefieras)
  const TicketPortal = () =>
    printPedido ? (
      <div style={{ position: "fixed", left: "-9999px", top: 0 }}>
        <div
          ref={ticketRef}
          // react-to-print imprimirá el contenido del ref
          dangerouslySetInnerHTML={{ __html: buildTicket80mmHtml(printPedido) }}
        />
      </div>
    ) : null;

  return { printTicket, TicketPortal };
}

// UNUSED: `useTicketPrint` is not referenced anywhere in the codebase.
// Kept exported in case it's needed later; to fully remove it, delete this file.
