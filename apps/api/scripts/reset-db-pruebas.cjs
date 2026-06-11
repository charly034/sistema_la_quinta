const { Client } = require("pg");

function validarUrlPruebas(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("DATABASE_URL_PRUEBAS inválida");
  }

  const host = String(parsed.hostname || "").toLowerCase();
  const db = String((parsed.pathname || "").replace(/^\//, "")).toLowerCase();

  const contieneEntornoPruebas =
    /(prueba|test|testing|qa)/.test(host) ||
    /(prueba|test|testing|qa)/.test(db);
  if (!contieneEntornoPruebas) {
    throw new Error(
      "Bloqueado: la base objetivo no parece de pruebas (host/db sin prueba|test|testing|qa)",
    );
  }

  const hostProductivo = /(prod|production|primary|master)/.test(host);
  const dbProductiva = /(prod|production)/.test(db);
  if (hostProductivo || dbProductiva) {
    throw new Error("Bloqueado: host o base con patrón productivo");
  }
}

async function main() {
  if (process.env.DATABASE_URL) {
    throw new Error(
      "Bloqueado: este script no acepta DATABASE_URL, solo DATABASE_URL_PRUEBAS",
    );
  }

  const url = process.env.DATABASE_URL_PRUEBAS;
  if (!url) throw new Error("DATABASE_URL_PRUEBAS no definida");

  validarUrlPruebas(url);

  const confirmacion = process.env.RESET_DB_CONFIRMACION;
  if (confirmacion !== "RESET_DB_PRUEBAS") {
    throw new Error(
      "Confirmación requerida: exportar RESET_DB_CONFIRMACION=RESET_DB_PRUEBAS",
    );
  }

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
