const { Client } = require("pg");

async function main() {
  const url = process.env.DATABASE_URL_PRUEBAS;
  if (!url) throw new Error("DATABASE_URL_PRUEBAS no definida");

  const client = new Client({ connectionString: url });
  await client.connect();

  const correo = "propietario.pruebas@laquinta.local";
  const usuario = await client.query(
    "SELECT id, correo FROM usuarios WHERE correo = $1 LIMIT 1",
    [correo],
  );

  const roles = await client.query(
    "SELECT COUNT(*)::int AS n FROM usuarios_roles ur JOIN roles r ON r.id = ur.rol_id JOIN usuarios u ON u.id = ur.usuario_id WHERE u.correo = $1 AND r.codigo = 'PROPIETARIO'",
    [correo],
  );

  const dupUsuarioRol = await client.query(
    "SELECT COUNT(*)::int AS n FROM (SELECT usuario_id, rol_id, COUNT(*) c FROM usuarios_roles GROUP BY usuario_id, rol_id HAVING COUNT(*) > 1) t",
  );

  console.log("USUARIO_PROPIETARIO=" + usuario.rowCount);
  console.log("ROL_PROPIETARIO_ASIGNADO=" + roles.rows[0].n);
  console.log("DUP_USUARIO_ROL=" + dupUsuarioRol.rows[0].n);

  await client.end();
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
