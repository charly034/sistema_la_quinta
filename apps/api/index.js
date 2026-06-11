import "dotenv/config";
import { createApp } from "./src/app.js";
import { closeDb, initDb } from "./src/config/db.js";
import {
  obtenerConfiguracionAplicacion,
  validarConfiguracionCritica,
} from "./src/config/entorno.js";

const app = createApp();
const PORT = Number(process.env.PORT) || 3000;

const configuracion = obtenerConfiguracionAplicacion();
validarConfiguracionCritica(configuracion);

await initDb();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 API La Quinta corriendo en puerto ${PORT}`);
});

async function shutdown() {
  try {
    await closeDb();
    console.log("Pool de DB cerrado");
  } catch (err) {
    console.warn("Error al cerrar pool:", err?.message || err);
  }
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
