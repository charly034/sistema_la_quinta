import "dotenv/config";
import { initDb, closeDb, getPool } from "../src/config/db.js";

async function main() {
  await initDb();
  const pool = getPool();
  if (!pool) {
    throw new Error("No hay conexion a la base de datos");
  }

  const resultado = await pool.query(
    `DELETE FROM sesiones_refresco WHERE expira_en < NOW() OR revocado_en IS NOT NULL AND expira_en < NOW()`,
  );

  console.log(`Sesiones vencidas limpiadas: ${resultado.rowCount}`);
  await closeDb();
}

main().catch(async (error) => {
  console.error(error?.message || error);
  await closeDb();
  process.exit(1);
});
