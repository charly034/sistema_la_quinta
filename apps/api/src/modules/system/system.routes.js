import { Router } from "express";
import { getPool, logDbError } from "../../config/db.js";
import { ensurePool } from "../../utils/http.js";

const router = Router();

router.get("/db", async (_req, res) => {
  try {
    const pool = getPool();
    if (!ensurePool(res, pool)) return;

    const r = await pool.query("SELECT 1 as ok");
    res.json({ ok: true, db: r.rows[0].ok });
  } catch (e) {
    logDbError("DB test", e);
    res.status(500).json({ ok: false, error: e?.message });
  }
});

export default router;
