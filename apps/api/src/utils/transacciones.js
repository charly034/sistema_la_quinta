import { getPool } from "../config/db.js";

export async function ejecutarEnTransaccion(callback) {
  const pool = getPool();
  if (!pool) {
    throw new Error("Pool de base de datos no inicializado");
  }

  const cliente = await pool.connect();
  try {
    await cliente.query("BEGIN");
    const resultado = await callback(cliente);
    await cliente.query("COMMIT");
    return resultado;
  } catch (error) {
    try {
      await cliente.query("ROLLBACK");
    } catch {
      // sin-op
    }
    throw error;
  } finally {
    cliente.release();
  }
}
