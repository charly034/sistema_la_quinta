import "dotenv/config";
import readline from "readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { crearUsuarioInicialServicio } from "../src/modules/autenticacion/autenticacion.servicio.js";
import { ejecutarEnTransaccion } from "../src/utils/transacciones.js";
import { crearAuditoria } from "../src/modules/autenticacion/autenticacion.repositorio.js";
import { generarIdentificador } from "../src/utils/seguridad.js";
import { initDb, closeDb, getPool } from "../src/config/db.js";

async function main() {
  const rl = readline.createInterface({ input, output });
  try {
    const correo = (
      process.env.CORREO_PROPETARIO ||
      (await rl.question("Correo del propietario inicial: "))
    ).trim();
    const contrasena =
      process.env.CONTRASENA_PROPETARIO ||
      (await rl.question("Contrasena inicial: "));
    const nombre = (
      process.env.NOMBRE_PROPETARIO || (await rl.question("Nombre visible: "))
    ).trim();

    await initDb();
    const resultado = await crearUsuarioInicialServicio({
      correo,
      contrasena,
      nombre,
    });

    await ejecutarEnTransaccion(async (cliente) => {
      const rolPropietario = await cliente.query(
        "SELECT id FROM roles WHERE codigo = $1 LIMIT 1",
        ["PROPIETARIO"],
      );

      if (rolPropietario.rows[0]) {
        await cliente.query(
          "INSERT INTO usuarios_roles (usuario_id, rol_id, creado_en) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING",
          [resultado.usuario.id, rolPropietario.rows[0].id],
        );
      }

      await crearAuditoria(
        {
          id: generarIdentificador(),
          usuarioId: null,
          accion: resultado.existente
            ? "REASIGNAR_PROPIETARIO"
            : "CREAR_PROPIETARIO",
          entidad: "usuarios",
          entidadId: resultado.usuario.id,
          datosPosteriores: {
            correo: resultado.usuario.correo,
            nombre: resultado.usuario.nombre,
          },
          motivo: "Inicializacion segura del propietario",
        },
        cliente,
      );
    });

    console.log(
      resultado.existente
        ? "Usuario propietario existente verificado."
        : "Usuario propietario creado.",
    );
  } finally {
    rl.close();
    await closeDb();
  }
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
