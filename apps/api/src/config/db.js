import pkg from "pg";

const { Pool } = pkg;

let pool = null;

function isTruthyEnv(v) {
  return !!v && ["1", "true", "yes", "on"].includes(String(v).toLowerCase());
}

function isLocalHost(h) {
  if (!h) return false;
  return ["localhost", "127.0.0.1"].includes(String(h).toLowerCase());
}

export function createDbConfig() {
  const forceLocal = isTruthyEnv(process.env.DB_FORCE_LOCAL);
  const forceRemote = isTruthyEnv(process.env.DB_FORCE_REMOTE);
  const hasDatabaseUrl = !!process.env.DATABASE_URL;
  const hasHost = !!process.env.DB_HOST;
  const detectedRemote =
    hasDatabaseUrl || (hasHost && !isLocalHost(process.env.DB_HOST));
  const isDev = (process.env.NODE_ENV || "").toLowerCase() === "development";
  const useRemote = forceRemote || (!forceLocal && isDev && detectedRemote);

  const dbSslEnv = (process.env.DB_SSL || "").toString().toLowerCase();
  const defaultSsl = !!(hasDatabaseUrl && !isLocalHost(process.env.DB_HOST));
  const useSsl = dbSslEnv
    ? ["1", "true", "yes", "on"].includes(dbSslEnv)
    : defaultSsl;

  return {
    useRemote,
    config: {
      connectionString: process.env.DATABASE_URL || undefined,
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
        ? String(process.env.DB_PASSWORD)
        : undefined,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
    },
  };
}

export async function initDb() {
  const { useRemote, config } = createDbConfig();

  console.log(
    useRemote
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

  const candidate = new Pool(config);

  try {
    await candidate.query("SELECT 1");
    console.log(
      useRemote ? "✅ DB conectada (remota)" : "✅ DB conectada (local)",
    );
    pool = candidate;
  } catch (err) {
    logDbError("DB conexión inicial", err);
    console.log(
      "⚠️  Error conectando a la DB — deshabilitando endpoints de DB",
    );
    try {
      await candidate.end();
    } catch {
      // ignore
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

export function logDbError(context, e) {
  const info = {
    message: e?.message,
    code: e?.code,
    detail: e?.detail,
    hint: e?.hint,
    where: e?.where,
  };
  console.error(`${context} error:`, info);
  return info;
}
