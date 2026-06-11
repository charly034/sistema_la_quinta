import pkg from "pg";

const { Pool } = pkg;

let pool = null;

function esValorVerdadero(valor) {
  return (
    !!valor && ["1", "true", "yes", "on"].includes(String(valor).toLowerCase())
  );
}

function esHostLocal(host) {
  if (!host) return false;
  return ["localhost", "127.0.0.1"].includes(String(host).toLowerCase());
}

export function crearConfiguracionDb() {
  const databaseUrlPruebas = process.env.DATABASE_URL_PRUEBAS || "";
  const databaseUrl = databaseUrlPruebas || process.env.DATABASE_URL || "";
  const forzarLocal = esValorVerdadero(process.env.DB_FORCE_LOCAL);
  const forzarRemota = esValorVerdadero(process.env.DB_FORCE_REMOTE);
  const tieneDatabaseUrl = !!databaseUrl;
  const tieneHost = !!process.env.DB_HOST;
  const detectadoRemoto =
    tieneDatabaseUrl || (tieneHost && !esHostLocal(process.env.DB_HOST));
  const esDesarrollo =
    (process.env.NODE_ENV || "").toLowerCase() === "development";
  const usarRemota =
    forzarRemota || (!forzarLocal && esDesarrollo && detectadoRemoto);

  const dbSslEnv = (process.env.DB_SSL || "").toString().toLowerCase();
  let hostDesdeUrl = "";
  if (databaseUrl) {
    try {
      hostDesdeUrl = new URL(databaseUrl).hostname;
    } catch {
      hostDesdeUrl = "";
    }
  }

  const sslPorDefecto = !!(tieneDatabaseUrl && !esHostLocal(hostDesdeUrl));
  const usarSsl = dbSslEnv
    ? ["1", "true", "yes", "on"].includes(dbSslEnv)
    : sslPorDefecto;

  return {
    usarRemota,
    config: {
      connectionString: databaseUrl || undefined,
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
        ? String(process.env.DB_PASSWORD)
        : undefined,
      ssl: usarSsl ? { rejectUnauthorized: false } : false,
    },
  };
}

export async function initDb() {
  const { usarRemota, config } = crearConfiguracionDb();

  console.log(
    usarRemota
      ? "ℹ️  Usando DB remota (development o forzado)"
      : "ℹ️  Priorizando DB local (modo producción por defecto)",
  );

  console.log("📦 DB config:", {
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    usingDatabaseUrl: !!config.connectionString,
    ssl: !!config.ssl,
  });

  const candidata = new Pool(config);

  try {
    await candidata.query("SELECT 1");
    console.log(
      usarRemota ? "✅ DB conectada (remota)" : "✅ DB conectada (local)",
    );
    pool = candidata;
  } catch (error) {
    logDbError("DB conexión inicial", error);
    console.log(
      "⚠️  Error conectando a la DB — deshabilitando endpoints de DB",
    );
    try {
      await candidata.end();
    } catch {
      // ignorar
    }
    pool = null;
  }

  return pool;
}

export function getPool() {
  return pool;
}

export async function closeDb() {
  if (!pool) return;
  await pool.end();
  pool = null;
}

export async function ejecutarEnTransaccion(callback) {
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
      // ignorar
    }
    throw error;
  } finally {
    cliente.release();
  }
}

export function logDbError(contexto, error) {
  const info = {
    message: error?.message,
    code: error?.code,
    detail: error?.detail,
    hint: error?.hint,
    where: error?.where,
  };
  console.error(`${contexto} error:`, info);
  return info;
}
