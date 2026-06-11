import "dotenv/config";
import { initDb, closeDb } from "../src/config/db.js";

async function main() {
  await initDb();
  console.log(
    "La inicializacion de datos se gestiona mediante migraciones idempotentes.",
  );
  await closeDb();
}

main().catch(async (error) => {
  console.error(error?.message || error);
  await closeDb();
  process.exit(1);
});
