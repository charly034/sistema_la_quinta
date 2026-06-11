import { getPool } from "../../config/db.js";
import { normalizarCodigo, normalizarTexto } from "../../utils/seguridad.js";

export async function listarRoles({ pagina, tamano, buscar }, cliente = null) {
  const pool = cliente || getPool();
  const filtros = [];
  const valores = [];

  if (buscar) {
    valores.push(`%${buscar.trim()}%`);
    filtros.push(
      `(r.codigo ILIKE $${valores.length} OR r.nombre ILIKE $${valores.length})`,
    );
  }

  const where = filtros.length ? `WHERE ${filtros.join(" AND ")}` : "";

  valores.push(tamano, (pagina - 1) * tamano);

  const datos = await pool.query(
    `
      SELECT r.id, r.codigo, r.nombre, r.descripcion, r.estado, r.creado_en, r.actualizado_en, r.eliminado_en
      FROM roles r
      ${where}
      ORDER BY r.codigo
      LIMIT $${valores.length - 1} OFFSET $${valores.length}
    `,
    valores,
  );

  const total = await pool.query(
    `
      SELECT COUNT(*)::int AS total
      FROM roles r
      ${where}
    `,
    valores.slice(0, valores.length - 2),
  );

  return { filas: datos.rows, total: total.rows[0].total };
}

export async function obtenerRolPorId(id, cliente = null) {
  const pool = cliente || getPool();
  const resultado = await pool.query(
    `SELECT id, codigo, nombre, descripcion, estado, creado_en, actualizado_en, eliminado_en FROM roles WHERE id = $1 LIMIT 1`,
    [id],
  );
  return resultado.rows[0] || null;
}

export async function obtenerPermisosRol(id, cliente = null) {
  const pool = cliente || getPool();
  const resultado = await pool.query(
    `
      SELECT p.id, p.codigo, p.nombre, p.descripcion
      FROM roles_permisos rp
      INNER JOIN permisos p ON p.id = rp.permiso_id
      WHERE rp.rol_id = $1
      ORDER BY p.codigo
    `,
    [id],
  );
  return resultado.rows;
}

export async function crearRol(datos, cliente = null) {
  const pool = cliente || getPool();
  const resultado = await pool.query(
    `
      INSERT INTO roles (id, codigo, nombre, descripcion, estado, creado_en, actualizado_en, eliminado_en)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NULL)
      RETURNING id, codigo, nombre, descripcion, estado, creado_en, actualizado_en, eliminado_en
    `,
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

export async function actualizarRol(id, datos, cliente = null) {
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

  if (!campos.length) return obtenerRolPorId(id, cliente);

  campos.push(`actualizado_en = NOW()`);
  valores.push(id);

  const resultado = await pool.query(
    `
      UPDATE roles
      SET ${campos.join(", ")}
      WHERE id = $${valores.length}
      RETURNING id, codigo, nombre, descripcion, estado, creado_en, actualizado_en, eliminado_en
    `,
    valores,
  );

  return resultado.rows[0] || null;
}

export async function reemplazarPermisosRol(idRol, permisos, cliente = null) {
  const pool = cliente || getPool();
  await pool.query(`DELETE FROM roles_permisos WHERE rol_id = $1`, [idRol]);
  if (!permisos.length) return [];

  const resultadoPermisos = await pool.query(
    `SELECT id, codigo FROM permisos WHERE codigo = ANY($1::text[]) ORDER BY codigo`,
    [permisos.map(normalizarCodigo)],
  );

  const filasInsertadas = [];
  for (const permiso of resultadoPermisos.rows) {
    await pool.query(
      `INSERT INTO roles_permisos (rol_id, permiso_id, creado_en) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING`,
      [idRol, permiso.id],
    );
    filasInsertadas.push(permiso.codigo);
  }

  return filasInsertadas;
}

export async function listarPermisos(cliente = null) {
  const pool = cliente || getPool();
  const resultado = await pool.query(
    `SELECT id, codigo, nombre, descripcion, creado_en FROM permisos ORDER BY codigo`,
  );
  return resultado.rows;
}

export async function obtenerPermisoPorCodigo(codigo, cliente = null) {
  const pool = cliente || getPool();
  const resultado = await pool.query(
    `SELECT id, codigo, nombre, descripcion FROM permisos WHERE codigo = $1 LIMIT 1`,
    [normalizarCodigo(codigo)],
  );
  return resultado.rows[0] || null;
}

export async function obtenerRolPorCodigo(codigo, cliente = null) {
  const pool = cliente || getPool();
  const resultado = await pool.query(
    `SELECT id, codigo, nombre, descripcion, estado, creado_en, actualizado_en, eliminado_en FROM roles WHERE codigo = $1 LIMIT 1`,
    [normalizarCodigo(codigo)],
  );
  return resultado.rows[0] || null;
}
