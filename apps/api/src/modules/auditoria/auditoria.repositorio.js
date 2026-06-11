import { getPool } from "../../config/db.js";

export async function listarAuditoria(
  { pagina, tamano, usuarioId, accion, entidad, entidadId, desde, hasta },
  cliente = null,
) {
  const pool = cliente || getPool();
  const condiciones = [];
  const valores = [];

  if (usuarioId) {
    valores.push(usuarioId);
    condiciones.push(`a.usuario_id = $${valores.length}`);
  }
  if (accion) {
    valores.push(accion);
    condiciones.push(`a.accion = $${valores.length}`);
  }
  if (entidad) {
    valores.push(entidad);
    condiciones.push(`a.entidad = $${valores.length}`);
  }
  if (entidadId) {
    valores.push(entidadId);
    condiciones.push(`a.entidad_id = $${valores.length}`);
  }
  if (desde) {
    valores.push(desde);
    condiciones.push(`a.creado_en >= $${valores.length}`);
  }
  if (hasta) {
    valores.push(hasta);
    condiciones.push(`a.creado_en <= $${valores.length}`);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
  valores.push(tamano, (pagina - 1) * tamano);

  const datos = await pool.query(
    `
      SELECT a.id, a.usuario_id, a.accion, a.entidad, a.entidad_id, a.datos_anteriores, a.datos_posteriores, a.direccion_ip, a.agente_usuario, a.motivo, a.creado_en
      FROM auditoria a
      ${where}
      ORDER BY a.creado_en DESC
      LIMIT $${valores.length - 1} OFFSET $${valores.length}
    `,
    valores,
  );

  const total = await pool.query(
    `SELECT COUNT(*)::int AS total FROM auditoria a ${where}`,
    valores.slice(0, valores.length - 2),
  );

  return { filas: datos.rows, total: total.rows[0].total };
}
