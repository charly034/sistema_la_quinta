export function normalizeModalidad(modalidad) {
  const m = String(modalidad ?? "")
    .trim()
    .toLowerCase();
  if (m.includes("del")) return "DELIVERY";
  return "RETIRO";
}

export function getBadgeClass(modalidad) {
  const m = String(modalidad ?? "")
    .trim()
    .toLowerCase();
  return m === "delivery" ? "delivery" : "retiro";
}
