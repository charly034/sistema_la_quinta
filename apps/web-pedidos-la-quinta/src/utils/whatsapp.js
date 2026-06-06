// src/utils/whatsapp.js

export function onlyDigits(str) {
  return String(str ?? "").replace(/\D/g, "");
}

/**
 * Normaliza teléfonos argentinos típicos para WhatsApp.
 * Acepta ejemplos:
 * - 2611234567
 * - 01112345678
 * - 11 1234-5678
 * - 0261 15 123-4567
 * - 0 11 15 1234 5678
 * - +54 9 261 1234567
 *
 * Devuelve: "549" + (area+numero)  (ej: 5492611234567, 5491112345678)
 * Si no puede, devuelve "".
 */
export function toWhatsAppAR(phone) {
  let d = onlyDigits(phone);

  if (!d) return "";

  // Si ya vino con código país
  // +54...
  if (d.startsWith("54")) {
    // si ya tiene 549, listo
    if (d.startsWith("549")) return d;

    // si vino 54 + (area+numero), le metemos 9: 54 -> 549
    d = "549" + d.slice(2);
  }

  // Quitar prefijo 0 (troncales): 0 261..., 011..., 0261...
  if (d.startsWith("0")) d = d.slice(1);

  // A esta altura, lo esperado sin país suele ser:
  // - AMBA: 11 + 8 dígitos => 10 dígitos
  // - Interior: 2-4 dígitos de área + 6-8 dígitos => típicamente 10 u 11 dígitos
  // Si ya empieza con 549, validamos un poco y devolvemos.
  if (d.startsWith("549")) {
    return d.length >= 12 && d.length <= 15 ? d : "";
  }

  // Si NO trae país, asumimos AR móvil y le agregamos 549
  // Validación suave: números locales suelen quedar de 7 a 13 dígitos (sin 54/9)
  // Permitimos rango más amplio para evitar rechazar números válidos
  if (d.length < 7 || d.length > 13) return "";

  return `549${d}`;
}

export function buildWhatsAppUrl({ telefono, text }) {
  const wa = toWhatsAppAR(telefono);
  if (!wa) return "";

  const base = `https://wa.me/${wa}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function buildWhatsAppMessage(p) {
  const parts = [
    `Hola ${p?.nombre ?? ""} 👋`,
    `Te confirmo tu pedido:`,
    `${p?.productos ?? ""}`,
    "",
    `Modalidad: ${p?.modalidad ?? ""}`,
  ];
  return parts.join("\n").trim();
}
