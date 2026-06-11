import { listarAuditoria } from "./auditoria.repositorio.js";

export async function listarAuditoriaServicio(query) {
  return listarAuditoria(query);
}
