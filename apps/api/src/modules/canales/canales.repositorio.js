import { getPool } from "../../config/db.js";
import { normalizarCodigo, normalizarTexto } from "../../utils/seguridad.js";

export async function listarCanales(
  { pagina, tamano, buscar, estado },
  cliente = null,
) {
  const pool = cliente || getPool();
  const condiciones = [];
  const valores = [];
  if (buscar) {
    valores.push(`%${buscar.trim()}%`);
    condiciones.push(
      `(c.codigo ILIKE $${valores.length} OR c.nombre ILIKE $${valores.length})`,
    );
  }
  if (estado) {
    valores.push(estado.trim());
    condiciones.push(`c.estado = $${valores.length}`);
  }
  const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
  valores.push(tamano, (pagina - 1) * tamano);
  const datos = await pool.query(
    `SELECT c.id, c.codigo, c.nombre, c.descripcion, c.estado, c.creado_en, c.actualizado_en, c.eliminado_en FROM canales c ${where} ORDER BY c.codigo LIMIT $${valores.length - 1} OFFSET $${valores.length}`,
    valores,
  );
  const total = await pool.query(
    `SELECT COUNT(*)::int AS total FROM canales c ${where}`,
    valores.slice(0, valores.length - 2),
  );
  return { filas: datos.rows, total: total.rows[0].total };
}
export async function obtenerCanalPorId(id, cliente = null) {
  const pool = cliente || getPool();
  const resultado = await pool.query(
    `SELECT id, codigo, nombre, descripcion, estado, creado_en, actualizado_en, eliminado_en FROM canales WHERE id = $1 LIMIT 1`,
    [id],
  );
  return resultado.rows[0] || null;
}
export async function obtenerCanalPorCodigo(codigo, cliente = null) {
  const pool = cliente || getPool();
  const resultado = await pool.query(
    `SELECT id, codigo, nombre, descripcion, estado, creado_en, actualizado_en, eliminado_en FROM canales WHERE codigo = $1 LIMIT 1`,
    [normalizarCodigo(codigo)],
  );
  return resultado.rows[0] || null;
}
export async function crearCanal(datos, cliente = null) {
  const pool = cliente || getPool();
  const resultado = await pool.query(
    `INSERT INTO canales (id, codigo, nombre, descripcion, estado, creado_en, actualizado_en, eliminado_en) VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NULL) RETURNING id, codigo, nombre, descripcion, estado, creado_en, actualizado_en, eliminado_en`,
    [
      datos.id,
      normalizarCodigo(datos.codigo),
      normalizarTexto(datos.nombre),
      datos.descripcion ? normalizarTexto(datos.descripcion) : null,
      datos.estado || "ACTIVO",
    ],
  );
  return resultado.rows[0];
}
export async function actualizarCanal(id, datos, cliente = null) {
  const pool = cliente || getPool();
  const campos = [];
  const valores = [];
  if (datos.nombre !== undefined) {
    valores.push(normalizarTexto(datos.nombre));
    campos.push(`nombre = $${valores.length}`);
  }
  if (datos.descripcion !== undefined) {
    valores.push(datos.descripcion ? normalizarTexto(datos.descripcion) : null);
    campos.push(`descripcion = $${valores.length}`);
  }
  if (datos.estado !== undefined) {
    valores.push(datos.estado);
    campos.push(`estado = $${valores.length}`);
  }
  if (!campos.length) return obtenerCanalPorId(id, cliente);
  campos.push(`actualizado_en = NOW()`);
  valores.push(id);
  const resultado = await pool.query(
    `UPDATE canales SET ${campos.join(", ")} WHERE id = $${valores.length} RETURNING id, codigo, nombre, descripcion, estado, creado_en, actualizado_en, eliminado_en`,
    valores,
  );
  return resultado.rows[0] || null;
}
