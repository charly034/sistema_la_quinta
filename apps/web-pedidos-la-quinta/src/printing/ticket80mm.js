import { escapeHtml } from "../utils/text";
import { normalizeModalidad } from "../utils/pedido";

export function buildTicket80mmHtml(pedido) {
  const fecha = escapeHtml(pedido?.fecha ?? "");
  const hora = escapeHtml(pedido?.hora ?? "");
  const nombre = escapeHtml(pedido?.nombre ?? "");
  const telefono = escapeHtml(pedido?.telefono ?? "");
  const direccion = escapeHtml(pedido?.direccion ?? "");
  const modalidadBig = normalizeModalidad(pedido?.modalidad);

  const productosRaw = String(pedido?.productos ?? "").trim();
  const productosHtml = escapeHtml(productosRaw).replace(/\n/g, "<br/>");

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Ticket</title>

  <style>
    /* Tamaño de papel térmico */
    @page {
      size: 80mm auto;
      margin: 4mm;
    }

    html, body {
      margin: 0;
      padding: 0;
      width: 80mm;
      /* Fuente más clara y legible (sistema sans), peso normal */
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #111;
      font-weight: 400;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      background: white;
    }

    /* 🔥 CLAVE: SOLO IMPRIME EL TICKET */
    @media print {
      body * {
        visibility: hidden !important;
      }

      .paper, .paper * {
        visibility: visible !important;
      }

      .paper {
        position: fixed;
        left: 0;
        top: 0;
      }
    }

    .top-blank { height: 3.6em; } /* espacio inicial */

     /* Mover ligeramente el contenido a la derecha sin alterar el tamaño
       del papel: usamos padding-left con box-sizing para no desbordar */
     .paper { width: 72mm; margin: 0 auto; padding-left: 6mm; box-sizing: border-box; }

    .ticket { font-size: 14px; line-height: 1.35; }

    .center { text-align: center; }
    .muted { color: #444; }

    .brand { font-size: 26px; font-weight: 900; letter-spacing: 0.6px; }

    .client-name {
      font-size: 30px;
      font-weight: 900;
      text-align: center;
      margin-bottom: 8px;
    }

    .mode {
      margin-top: 8px;
      font-size: 26px;
      font-weight: 900;
      letter-spacing: 1.2px;
      padding: 8px 0;
      border: 3px solid #000;
      border-left: 0;
      border-right: 0;
      text-transform: uppercase;
      text-align: center;
    }

    .sep { border-top: 2px solid #000; margin: 10px 0; }

    .row { display: flex; justify-content: space-between; gap: 10px; }

    .label { font-weight: 700; font-size: 16px; }
    .value { text-align: right; font-size: 16px; }

    .block { margin-top: 8px; font-size: 16px; }

    .products {
      margin-top: 8px;
      /* Detalle más grande y con mayor legibilidad */
      font-size: 18px;
      line-height: 1.45;
      word-break: break-word;
      white-space: pre-wrap;
    }

    .cut { margin-top: 14px; padding-top: 12px; border-top: 3px dashed #000; }
    .cut .txt { margin-top: 8px; font-size: 14px; font-weight: 900; text-align: center; }

    .spacer { height: 12mm; }
  </style>
</head>

<body>
  <div class="top-blank"></div>

  <div class="paper">
    <div class="ticket">

      <br><br><br>

      <div class="mode">${modalidadBig}</div>

      <div class="center client-name">${nombre}</div>

      <div class="sep"></div>

      <div class="center brand">LA QUINTA COMIDAS</div>

      <div class="sep"></div>

      <div class="row">
        <div class="label">Fecha</div>
        <div class="value">${fecha}</div>
      </div>

      <div class="row">
        <div class="label">Hora</div>
        <div class="value">${hora}</div>
      </div>

      <div class="sep"></div>

      <div class="block">
        <div class="label">Tel</div>
        <div>${telefono}</div>
      </div>

      ${
        direccion
          ? `<div class="block">
              <div class="label">Dirección</div>
              <div>${direccion}</div>
            </div>`
          : ""
      }

      <div class="sep"></div>

      <div class="label">Detalle</div>
      <div class="products">${productosHtml || "-"}</div>

      <div class="sep"></div>

      <div class="center muted" style="margin-top:10px;">¡Gracias!</div>

      <div class="cut">
        <div class="txt">✂️ CORTE ACÁ</div>
      </div>

      <div class="spacer"></div>
    </div>
  </div>
</body>
</html>`;
}
