import { getPool } from "../../config/db.js";
import { normalizarCorreo, normalizarTexto } from "../../utils/seguridad.js";

export async function listarUsuarios(
  { pagina, tamano, buscar, estado },
  cliente = null,
) {
  const pool = cliente || getPool();
  const condiciones = [];
  const valores = [];

  if (buscar) {
    valores.push(`%${buscar.trim()}%`);
    condiciones.push(
      `(u.nombre ILIKE $${valores.length} OR u.correo ILIKE $${valores.length})`,
    );
  }

  if (estado) {
    valores.push(estado.trim());
    condiciones.push(`u.estado = $${valores.length}`);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";

  valores.push(tamano, (pagina - 1) * tamano);

  const datos = await pool.query(
    `
      SELECT u.id, u.correo, u.nombre, u.estado, u.ultimo_acceso_en, u.creado_en, u.actualizado_en, u.eliminado_en
      FROM usuarios u
      ${where}
      ORDER BY u.creado_en DESC
      LIMIT $${valores.length - 1} OFFSET $${valores.length - 2}
    `,
    valores,
  );

  const total = await pool.query(
    `SELECT COUNT(*)::int AS total FROM usuarios u ${where}`,
    valores.slice(0, valores.length - 2),
  );

  return { filas: datos.rows, total: total.rows[0].total };
}

export async function obtenerUsuarioPorId(id, cliente = null) {
  const pool = cliente || getPool();
  const resultado = await pool.query(
    `SELECT id, correo, nombre, estado, ultimo_acceso_en, creado_en, actualizado_en, eliminado_en FROM usuarios WHERE id = $1 LIMIT 1`,
    [id],
  );
  return resultado.rows[0] || null;
}

export async function obtenerUsuarioConContrasenaPorId(id, cliente = null) {
  const pool = cliente || getPool();
  const resultado = await pool.query(
    `SELECT id, correo, hash_contrasena, nombre, estado, ultimo_acceso_en, creado_en, actualizado_en, eliminado_en FROM usuarios WHERE id = $1 LIMIT 1`,
    [id],
  );
  return resultado.rows[0] || null;
}

export async function obtenerUsuarioPorCorreo(correo, cliente = null) {
  const pool = cliente || getPool();
  const resultado = await pool.query(
    `SELECT id, correo, nombre, estado, ultimo_acceso_en, creado_en, actualizado_en, eliminado_en FROM usuarios WHERE correo = $1 LIMIT 1`,
    [normalizarCorreo(correo)],
  );
  return resultado.rows[0] || null;
}

export async function crearUsuario(datos, cliente = null) {
  const pool = cliente || getPool();
  const resultado = await pool.query(
    `
      INSERT INTO usuarios (id, correo, hash_contrasena, nombre, estado, ultimo_acceso_en, creado_en, actualizado_en, eliminado_en)
      VALUES ($1, $2, $3, $4, $5, NULL, NOW(), NOW(), NULL)
      RETURNING id, correo, nombre, estado, ultimo_acceso_en, creado_en, actualizado_en, eliminado_en
    `,
    [
      datos.id,
      normalizarCorreo(datos.correo),
      datos.hashContrasena,
      normalizarTexto(datos.nombre),
      datos.estado || "ACTIVO",
    ],
  );
  return resultado.rows[0];
}

export async function actualizarUsuario(id, datos, cliente = null) {
  const pool = cliente || getPool();
  const columnas = [];
  const valores = [];

  if (datos.correo !== undefined) {
    valores.push(normalizarCorreo(datos.correo));
    columnas.push(`correo = $${valores.length}`);
  }
  if (datos.nombre !== undefined) {
    valores.push(normalizarTexto(datos.nombre));
    columnas.push(`nombre = $${valores.length}`);
  }
  if (datos.estado !== undefined) {
    valores.push(datos.estado);
    columnas.push(`estado = $${valores.length}`);
  }

  if (!columnas.length) {
    return obtenerUsuarioPorId(id, cliente);
  }

  columnas.push(`actualizado_en = NOW()`);
  valores.push(id);

  const resultado = await pool.query(
    `UPDATE usuarios SET ${columnas.join(", ")} WHERE id = $${valores.length} RETURNING id, correo, nombre, estado, ultimo_acceso_en, creado_en, actualizado_en, eliminado_en`,
    valores,
  );
  return resultado.rows[0] || null;
}

export async function cambiarEstadoUsuario(id, estado, cliente = null) {
  return actualizarUsuario(id, { estado }, cliente);
}

export async function reemplazarRolesUsuario(
  idUsuario,
  rolesIds,
  cliente = null,
) {
  const pool = cliente || getPool();
  await pool.query(`DELETE FROM usuarios_roles WHERE usuario_id = $1`, [
    idUsuario,
  ]);
  if (!rolesIds.length) return [];

  const roles = await pool.query(
    `SELECT id, codigo FROM roles WHERE codigo = ANY($1::text[])`,
    [rolesIds],
  );
  for (const rol of roles.rows) {
    await pool.query(
      `INSERT INTO usuarios_roles (usuario_id, rol_id, creado_en) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING`,
      [idUsuario, rol.id],
    );
  }

  return roles.rows;
}

export async function obtenerRolesUsuario(idUsuario, cliente = null) {
  const pool = cliente || getPool();
  const resultado = await pool.query(
    `
      SELECT r.id, r.codigo, r.nombre
      FROM usuarios_roles ur
      INNER JOIN roles r ON r.id = ur.rol_id
      WHERE ur.usuario_id = $1
      ORDER BY r.codigo
    `,
    [idUsuario],
  );
  return resultado.rows;
}
