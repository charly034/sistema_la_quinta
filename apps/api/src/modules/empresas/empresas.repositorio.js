import { getPool } from "../../config/db.js";
import { normalizarCodigo, normalizarTexto } from "../../utils/seguridad.js";

export async function listarEmpresas(
  { pagina, tamano, buscar, estado, marca },
  cliente = null,
) {
  const pool = cliente || getPool();
  const condiciones = [];
  const valores = [];
  if (buscar) {
    valores.push(`%${buscar.trim()}%`);
    condiciones.push(
      `(e.codigo ILIKE $${valores.length} OR e.nombre ILIKE $${valores.length})`,
    );
  }
  if (estado) {
    valores.push(estado.trim());
    condiciones.push(`e.estado = $${valores.length}`);
  }
  if (marca) {
    valores.push(marca.trim());
    condiciones.push(
      `EXISTS (SELECT 1 FROM empresas_marcas em INNER JOIN marcas m ON m.id = em.marca_id WHERE em.empresa_id = e.id AND m.codigo = $${valores.length})`,
    );
  }
  const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
  valores.push(tamano, (pagina - 1) * tamano);
  const datos = await pool.query(
    `SELECT e.id, e.codigo, e.nombre, e.descripcion, e.estado, e.creado_en, e.actualizado_en, e.eliminado_en FROM empresas e ${where} ORDER BY e.codigo LIMIT $${valores.length - 1} OFFSET $${valores.length}`,
    valores,
  );
  const total = await pool.query(
    `SELECT COUNT(*)::int AS total FROM empresas e ${where}`,
    valores.slice(0, valores.length - 2),
  );
  return { filas: datos.rows, total: total.rows[0].total };
}
export async function obtenerEmpresaPorId(id, cliente = null) {
  const pool = cliente || getPool();
  const resultado = await pool.query(
    `SELECT id, codigo, nombre, descripcion, estado, creado_en, actualizado_en, eliminado_en FROM empresas WHERE id = $1 LIMIT 1`,
    [id],
  );
  return resultado.rows[0] || null;
}
export async function obtenerEmpresaPorCodigo(codigo, cliente = null) {
  const pool = cliente || getPool();
  const resultado = await pool.query(
    `SELECT id, codigo, nombre, descripcion, estado, creado_en, actualizado_en, eliminado_en FROM empresas WHERE codigo = $1 LIMIT 1`,
    [normalizarCodigo(codigo)],
  );
  return resultado.rows[0] || null;
}
export async function crearEmpresa(datos, cliente = null) {
  const pool = cliente || getPool();
  const resultado = await pool.query(
    `INSERT INTO empresas (id, codigo, nombre, descripcion, estado, creado_en, actualizado_en, eliminado_en) VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NULL) RETURNING id, codigo, nombre, descripcion, estado, creado_en, actualizado_en, eliminado_en`,
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
export async function actualizarEmpresa(id, datos, cliente = null) {
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
  if (!campos.length) return obtenerEmpresaPorId(id, cliente);
  campos.push(`actualizado_en = NOW()`);
  valores.push(id);
  const resultado = await pool.query(
    `UPDATE empresas SET ${campos.join(", ")} WHERE id = $${valores.length} RETURNING id, codigo, nombre, descripcion, estado, creado_en, actualizado_en, eliminado_en`,
    valores,
  );
  return resultado.rows[0] || null;
}
export async function reemplazarMarcasEmpresa(
  idEmpresa,
  marcasCodigos,
  cliente = null,
) {
  const pool = cliente || getPool();
  await pool.query(`DELETE FROM empresas_marcas WHERE empresa_id = $1`, [
    idEmpresa,
  ]);
  if (!marcasCodigos.length) return [];
  const marcas = await pool.query(
    `SELECT id, codigo FROM marcas WHERE codigo = ANY($1::text[])`,
    [marcasCodigos.map(normalizarCodigo)],
  );
  for (const marca of marcas.rows) {
    await pool.query(
      `INSERT INTO empresas_marcas (empresa_id, marca_id, creado_en) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING`,
      [idEmpresa, marca.id],
    );
  }
  return marcas.rows;
}
