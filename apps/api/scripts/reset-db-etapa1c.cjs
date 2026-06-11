const { Client } = require("pg");

async function main() {
  const url = process.env.DATABASE_URL_PRUEBAS;
  if (!url) throw new Error("DATABASE_URL_PRUEBAS no definida");

  const client = new Client({ connectionString: url });
  await client.connect();

  await client.query("BEGIN");
  await client.query("DROP SCHEMA IF EXISTS public CASCADE");
  await client.query("CREATE SCHEMA public");
  await client.query("COMMIT");

  await client.end();
  console.log("RESET_SCHEMA_OK");
}

main().catch(async (error) => {
  console.error(error.message || error);
  process.exit(1);
});
