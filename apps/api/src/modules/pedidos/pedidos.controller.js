import { getPool, logDbError } from "../../config/db.js";
import { ensurePool, sendServerError } from "../../utils/http.js";

export async function getPedidos(_req, res) {
  try {
    const pool = getPool();
    if (!ensurePool(res, pool)) return;

    const q = `
      SELECT
        id,
        fecha,
        hora,
        telefono,
        nombre,
        direccion,
        modalidad,
        productos,
        estado
      FROM pedidos
      ORDER BY fecha DESC, hora DESC
      LIMIT 100
    `;

    const r = await pool.query(q);
    res.json(r.rows);
  } catch (e) {
    logDbError("GET /pedidos", e);
    sendServerError(res, "Error al obtener pedidos");
  }
}

export async function createPedido(req, res) {
  try {
    const pool = getPool();
    if (!ensurePool(res, pool)) return;

    const {
      id,
      fecha,
      hora,
      telefono,
      nombre,
      direccion,
      modalidad,
      productos,
      estado,
    } = req.body;

    const q = `
      INSERT INTO pedidos (id, fecha, hora, telefono, nombre, direccion, modalidad, productos, estado)
      VALUES ($1, to_date($2,'DD/MM/YYYY'), $3::time, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO NOTHING
    `;

    await pool.query(q, [
      id,
      fecha,
      hora,
      String(telefono),
      nombre,
      direccion || null,
      modalidad,
      productos,
      estado || null,
    ]);

    res.json({ ok: true, id });
  } catch (e) {
    logDbError("POST /pedidos", e);
    sendServerError(res, "Error al guardar pedido");
  }
}

export async function getPedidoById(req, res) {
  try {
    const pool = getPool();
    if (!ensurePool(res, pool)) return;

    const { id } = req.params;
    const q = `SELECT id, fecha, hora, telefono, nombre, direccion, modalidad, productos, estado FROM pedidos WHERE id = $1 LIMIT 1`;
    const r = await pool.query(q, [id]);

    if (r.rowCount === 0) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    res.json({ ok: true, row: r.rows[0] });
  } catch (e) {
    logDbError("GET /pedidos/:id", e);
    sendServerError(res, "Error al obtener pedido");
  }
}

export async function updatePedidoEstado(req, res) {
  try {
    const pool = getPool();
    if (!ensurePool(res, pool)) return;

    const { id } = req.params;
    const { estado } = req.body;

    const q = `UPDATE pedidos SET estado = $1 WHERE id = $2 RETURNING *`;
    const r = await pool.query(q, [estado, id]);

    if (r.rowCount === 0) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    res.json({ ok: true, row: r.rows[0] });
  } catch (e) {
    logDbError("PUT /pedidos/:id/estado", e);
    sendServerError(res, "Error al actualizar estado del pedido");
  }
}

export async function setupPedidosTable(_req, res) {
  try {
    const pool = getPool();
    if (!ensurePool(res, pool)) return;

    const q = `
      CREATE TABLE IF NOT EXISTS pedidos (
        id TEXT PRIMARY KEY,
        fecha DATE NOT NULL,
        hora TIME NOT NULL,
        telefono TEXT NOT NULL,
        nombre TEXT NOT NULL,
        direccion TEXT,
        modalidad TEXT NOT NULL,
        productos TEXT NOT NULL,
        estado TEXT
      );
    `;

    await pool.query(q);
    res.json({ ok: true });
  } catch (e) {
    logDbError("POST /setup", e);
    res.status(500).json({ ok: false, error: e?.message });
  }
}
