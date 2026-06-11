const { randomUUID } = require("crypto");

const NUEVOS_PERMISOS = [
  ["PLATOS_LEER", "Leer platos"],
  ["PLATOS_GESTIONAR", "Gestionar platos"],
  ["CLASIFICACIONES_PLATOS_LEER", "Leer clasificaciones de platos"],
  ["CLASIFICACIONES_PLATOS_GESTIONAR", "Gestionar clasificaciones de platos"],
];

const MAPA_ROL_PERMISOS = {
  PROPIETARIO: NUEVOS_PERMISOS.map((item) => item[0]),
  ADMINISTRADOR: NUEVOS_PERMISOS.map((item) => item[0]),
  EDITOR: ["PLATOS_LEER", "PLATOS_GESTIONAR", "CLASIFICACIONES_PLATOS_LEER"],
  LECTOR: ["PLATOS_LEER", "CLASIFICACIONES_PLATOS_LEER"],
  CLIENTE: [],
};

exports.up = async (pgm) => {
  for (const [codigo, nombre] of NUEVOS_PERMISOS) {
    await pgm.db.query(
      "INSERT INTO permisos (id, codigo, nombre, descripcion, creado_en) VALUES ($1, $2, $3, NULL, NOW()) ON CONFLICT (codigo) DO NOTHING",
      [randomUUID(), codigo, nombre],
    );
  }

  const permisosDb = await pgm.db.query(
    "SELECT id, codigo FROM permisos WHERE codigo = ANY($1)",
    [NUEVOS_PERMISOS.map((item) => item[0])],
  );
  const rolesDb = await pgm.db.query(
    "SELECT id, codigo FROM roles WHERE codigo = ANY($1)",
    [Object.keys(MAPA_ROL_PERMISOS)],
  );

  const permisosPorCodigo = Object.fromEntries(
    permisosDb.rows.map((fila) => [fila.codigo, fila.id]),
  );
  const rolesPorCodigo = Object.fromEntries(
    rolesDb.rows.map((fila) => [fila.codigo, fila.id]),
  );

  for (const [rolCodigo, permisos] of Object.entries(MAPA_ROL_PERMISOS)) {
    const rolId = rolesPorCodigo[rolCodigo];
    if (!rolId) continue;

    for (const permisoCodigo of permisos) {
      const permisoId = permisosPorCodigo[permisoCodigo];
      if (!permisoId) continue;

      await pgm.db.query(
        "INSERT INTO roles_permisos (rol_id, permiso_id, creado_en) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING",
        [rolId, permisoId],
      );
    }
  }
};

exports.down = async (pgm) => {
  await pgm.db.query(
    "DELETE FROM roles_permisos WHERE permiso_id IN (SELECT id FROM permisos WHERE codigo = ANY($1))",
    [NUEVOS_PERMISOS.map((item) => item[0])],
  );

  await pgm.db.query("DELETE FROM permisos WHERE codigo = ANY($1)", [
    NUEVOS_PERMISOS.map((item) => item[0]),
  ]);
};
