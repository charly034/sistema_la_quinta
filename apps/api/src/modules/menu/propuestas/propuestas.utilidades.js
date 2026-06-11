import crypto from "node:crypto";

export function crearRngDeterminista(semillaTexto) {
  let estado = crypto
    .createHash("sha256")
    .update(String(semillaTexto))
    .digest()
    .readUInt32LE(0);

  return function next() {
    estado = (1664525 * estado + 1013904223) >>> 0;
    return estado / 0x100000000;
  };
}

export function mezclarDeterminista(items, rng) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function semillaAleatoria() {
  return crypto.randomUUID();
}

export function huellaVersion(payload) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
}

export function semanasEntre(fechaAnterior, fechaActual) {
  if (!fechaAnterior || !fechaActual) return null;
  const a = new Date(
    `${String(fechaAnterior).slice(0, 10)}T00:00:00Z`,
  ).getTime();
  const b = new Date(`${String(fechaActual).slice(0, 10)}T00:00:00Z`).getTime();
  const dias = Math.floor((b - a) / 86400000);
  return Math.floor(dias / 7);
}

export function fechaHoyIso() {
  return new Date().toISOString().slice(0, 10);
}
