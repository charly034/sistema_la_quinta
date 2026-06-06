// YYYY-MM-DD en Mendoza
export function todayYMD_Mendoza() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Mendoza",
  });
}

// DD/MM/YYYY (Argentina)
export function todayLabelEsAR() {
  return new Date().toLocaleDateString("es-AR", {
    timeZone: "America/Argentina/Mendoza",
  });
}

// Normaliza a YYYY-MM-DD
export function normalizeToYMD(fecha) {
  if (fecha == null) return "";

  if (fecha instanceof Date) {
    return fecha.toLocaleDateString("en-CA", {
      timeZone: "America/Argentina/Mendoza",
    });
  }
  if (typeof fecha === "number") {
    return new Date(fecha).toLocaleDateString("en-CA", {
      timeZone: "America/Argentina/Mendoza",
    });
  }

  const f = String(fecha).trim();

  // ISO: YYYY-MM-DD...
  if (/^\d{4}-\d{2}-\d{2}/.test(f)) return f.slice(0, 10);

  // DD/MM/YYYY o DD-MM-YYYY
  // eslint-disable-next-line no-useless-escape
  const m = f.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);

  if (m) {
    const dd = m[1].padStart(2, "0");
    const mm = m[2].padStart(2, "0");
    const yyyy = m[3];
    return `${yyyy}-${mm}-${dd}`;
  }

  return "";
}
