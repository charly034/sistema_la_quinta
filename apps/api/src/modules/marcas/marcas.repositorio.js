import { getPool } from "../../config/db.js";
import { normalizarCodigo, normalizarTexto } from "../../utils/seguridad.js";

export async function listarMarcas(
  { pagina, tamano, buscar, estado },
  cliente = null,
) {
  const pool = cliente || getPool();
  const condiciones = [];
  const valores = [];

  if (buscar) {
    valores.push(`%${buscar.trim()}%`);
    condiciones.push(
      `(m.codigo ILIKE $${valores.length} OR m.nombre ILIKE $${valores.length})`,
    );
  }
  if (estado) {
    valores.push(estado.trim());
    condiciones.push(`m.estado = $${valores.length}`);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
  valores.push(tamano, (pagina - 1) * tamano);

  const datos = await pool.query(
    `SELECT m.id, m.codigo, m.nombre, m.descripcion, m.estado, m.creado_en, m.actualizado_en, m.eliminado_en FROM marcas m ${where} ORDER BY m.codigo LIMIT $${valores.length - 1} OFFSET $${valores.length}`,
    valores,
  );
  const total = await pool.query(
    `SELECT COUNT(*)::int AS total FROM marcas m ${where}`,
    valores.slice(0, valores.length - 2),
  );
  return { filas: datos.rows, total: total.rows[0].total };
}

export async function obtenerMarcaPorId(id, cliente = null) {
  const pool = cliente || getPool();
  const resultado = await pool.query(
    `SELECT id, codigo, nombre, descripcion, estado, creado_en, actualizado_en, eliminado_en FROM marcas WHERE id = $1 LIMIT 1`,
    [id],
  );
  return resultado.rows[0] || null;
}

export async function obtenerMarcaPorCodigo(codigo, cliente = null) {
  const pool = cliente || getPool();
  const resultado = await pool.query(
    `SELECT id, codigo, nombre, descripcion, estado, creado_en, actualizado_en, eliminado_en FROM marcas WHERE codigo = $1 LIMIT 1`,
    [normalizarCodigo(codigo)],
  );
  return resultado.rows[0] || null;
}

export async function crearMarca(datos, cliente = null) {
  const pool = cliente || getPool();
  const resultado = await pool.query(
    `INSERT INTO marcas (id, codigo, nombre, descripcion, estado, creado_en, actualizado_en, eliminado_en) VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NULL) RETURNING id, codigo, nombre, descripcion, estado, creado_en, actualizado_en, eliminado_en`,
    [
      datos.id,
      normalizarCodigo(datos.codigo),
      normalizarTexto(datos.nombre),
      datos.descripcion ? normalizarTexto(datos.descripcion) : null,
      datos.estado || "ACTIVA",
    ],
  );
  return resultado.rows[0];
}

export async function actualizarMarca(id, datos, cliente = null) {
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
  if (!campos.length) return obtenerMarcaPorId(id, cliente);
  campos.push(`actualizado_en = NOW()`);
  valores.push(id);
  const resultado = await pool.query(
    `UPDATE marcas SET ${campos.join(", ")} WHERE id = $${valores.length} RETURNING id, codigo, nombre, descripcion, estado, creado_en, actualizado_en, eliminado_en`,
    valores,
  );
  return resultado.rows[0] || null;
}
