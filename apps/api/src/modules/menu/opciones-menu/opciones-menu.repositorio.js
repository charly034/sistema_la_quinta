import { getPool } from "../../../config/db.js";
import { normalizarCodigo, normalizarTexto } from "../../../utils/seguridad.js";

export async function listarOpcionesMenu(
  { pagina, tamano, marca, estado },
  cliente = null,
) {
  const pool = cliente || getPool();
  const condiciones = [];
  const valores = [];
  if (marca) {
    valores.push(normalizarCodigo(marca));
    condiciones.push(`m.codigo = $${valores.length}`);
  }
  if (estado) {
    valores.push(estado.trim());
    condiciones.push(`o.estado = $${valores.length}`);
  }
  const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
  valores.push(tamano, (pagina - 1) * tamano);
  const datos = await pool.query(
    `SELECT o.id, o.marca_id, o.codigo, o.nombre, o.descripcion, o.orden, o.estado, o.creado_en, o.actualizado_en, o.eliminado_en FROM opciones_menu_marca o INNER JOIN marcas m ON m.id = o.marca_id ${where} ORDER BY m.codigo, o.orden, o.codigo LIMIT $${valores.length - 1} OFFSET $${valores.length}`,
    valores,
  );
  const total = await pool.query(
    `SELECT COUNT(*)::int AS total FROM opciones_menu_marca o INNER JOIN marcas m ON m.id = o.marca_id ${where}`,
    valores.slice(0, valores.length - 2),
  );
  return { filas: datos.rows, total: total.rows[0].total };
}
export async function obtenerOpcionMenuPorId(id, cliente = null) {
  const pool = cliente || getPool();
  const resultado = await pool.query(
    `SELECT id, marca_id, codigo, nombre, descripcion, orden, estado, creado_en, actualizado_en, eliminado_en FROM opciones_menu_marca WHERE id = $1 LIMIT 1`,
    [id],
  );
  return resultado.rows[0] || null;
}
export async function obtenerOpcionMenuPorCodigoYMarca(
  codigo,
  marcaId,
  cliente = null,
) {
  const pool = cliente || getPool();
  const resultado = await pool.query(
    `SELECT id, marca_id, codigo, nombre, descripcion, orden, estado, creado_en, actualizado_en, eliminado_en FROM opciones_menu_marca WHERE codigo = $1 AND marca_id = $2 LIMIT 1`,
    [normalizarCodigo(codigo), marcaId],
  );
  return resultado.rows[0] || null;
}
export async function crearOpcionMenu(datos, cliente = null) {
  const pool = cliente || getPool();
  const resultado = await pool.query(
    `INSERT INTO opciones_menu_marca (id, marca_id, codigo, nombre, descripcion, orden, estado, creado_en, actualizado_en, eliminado_en) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), NULL) RETURNING id, marca_id, codigo, nombre, descripcion, orden, estado, creado_en, actualizado_en, eliminado_en`,
    [
      datos.id,
      datos.marcaId,
      normalizarCodigo(datos.codigo),
      normalizarTexto(datos.nombre),
      datos.descripcion ? normalizarTexto(datos.descripcion) : null,
      datos.orden ?? 0,
      datos.estado || "ACTIVA",
    ],
  );
  return resultado.rows[0];
}
export async function actualizarOpcionMenu(id, datos, cliente = null) {
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
  if (datos.orden !== undefined) {
    valores.push(datos.orden);
    campos.push(`orden = $${valores.length}`);
  }
  if (datos.estado !== undefined) {
    valores.push(datos.estado);
    campos.push(`estado = $${valores.length}`);
  }
  if (!campos.length) return obtenerOpcionMenuPorId(id, cliente);
  campos.push(`actualizado_en = NOW()`);
  valores.push(id);
  const resultado = await pool.query(
    `UPDATE opciones_menu_marca SET ${campos.join(", ")} WHERE id = $${valores.length} RETURNING id, marca_id, codigo, nombre, descripcion, orden, estado, creado_en, actualizado_en, eliminado_en`,
    valores,
  );
  return resultado.rows[0] || null;
}
export async function reordenarOpcionesMenu(marcaId, opciones, cliente = null) {
  const pool = cliente || getPool();
  const ids = opciones.map((opcion) => opcion.id);
  const idsUnicos = new Set(ids);
  if (idsUnicos.size !== ids.length) {
    throw new Error("No se permiten IDs repetidos en el reordenamiento");
  }

  const filas = await pool.query(
    `SELECT id, marca_id FROM opciones_menu_marca WHERE id = ANY($1::uuid[])`,
    [ids],
  );
  if (filas.rows.length !== ids.length) {
    throw new Error("Existen opciones inexistentes para el reordenamiento");
  }
  if (filas.rows.some((fila) => fila.marca_id !== marcaId)) {
    throw new Error("Las opciones no pertenecen a la misma marca");
  }
  for (const opcion of opciones) {
    await pool.query(
      `UPDATE opciones_menu_marca SET orden = $1, actualizado_en = NOW() WHERE id = $2 AND marca_id = $3`,
      [opcion.orden, opcion.id, marcaId],
    );
  }
  return opciones;
}
