export function sendServerError(res, message = "Error interno") {
  return res.status(500).json({ error: message });
}

export function ensurePool(res, pool) {
  if (!pool) {
    res.status(500).json({
      error:
        "DB no configurada o sin conexion. Verifica .env (DATABASE_URL o DB_*) y logs de arranque.",
    });
    return false;
  }
  return true;
}
