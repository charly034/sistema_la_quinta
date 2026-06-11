export function normalizarTextoBusqueda(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export function normalizarDireccionOrden(valor) {
  return String(valor || "asc").toLowerCase() === "desc" ? "DESC" : "ASC";
}

export function estadoArchivado(valor) {
  return ["ARCHIVADO", "ARCHIVADA"].includes(String(valor || ""));
}
