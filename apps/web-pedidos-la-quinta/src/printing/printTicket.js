import { buildTicket80mmHtml } from "./ticket80mm";
import { printHtmlInHiddenIframe } from "./printIframe";

export function printTicket(pedido) {
  const html = buildTicket80mmHtml(pedido);

  try {
    // Imprimir en iframe oculto (no abre pestaña)
    printHtmlInHiddenIframe(html, { onDone: () => {} });
  } catch (e) {
    console.error("printHtmlInHiddenIframe falló:", e);
    alert(
      "Error al imprimir. Permití ventanas emergentes o probá desde otro navegador.",
    );
  }
}
