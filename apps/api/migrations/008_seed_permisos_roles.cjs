const { randomUUID } = require("crypto");

exports.up = async (pgm) => {
  const permisos = [
    ["USUARIOS_LEER", "Leer usuarios"],
    ["USUARIOS_GESTIONAR", "Gestionar usuarios"],
    ["ROLES_LEER", "Leer roles"],
    ["ROLES_GESTIONAR", "Gestionar roles"],
    ["AUDITORIA_LEER", "Leer auditoria"],
    ["MARCAS_LEER", "Leer marcas"],
    ["MARCAS_GESTIONAR", "Gestionar marcas"],
    ["CANALES_LEER", "Leer canales"],
    ["CANALES_GESTIONAR", "Gestionar canales"],
    ["EMPRESAS_LEER", "Leer empresas"],
    ["EMPRESAS_GESTIONAR", "Gestionar empresas"],
    ["OPCIONES_MENU_LEER", "Leer opciones de menu"],
    ["OPCIONES_MENU_GESTIONAR", "Gestionar opciones de menu"],
  ];

  for (const [codigo, nombre] of permisos) {
    await pgm.db.query(
      "INSERT INTO permisos (id, codigo, nombre, descripcion, creado_en) VALUES ($3, $1, $2, NULL, NOW()) ON CONFLICT (codigo) DO NOTHING",
      [codigo, nombre, randomUUID()],
    );
  }

  const roles = [
    ["PROPIETARIO", "Propietario"],
    ["ADMINISTRADOR", "Administrador"],
    ["EDITOR", "Editor"],
    ["LECTOR", "Lector"],
    ["CLIENTE", "Cliente"],
  ];

  for (const [codigo, nombre] of roles) {
    await pgm.db.query(
      "INSERT INTO roles (id, codigo, nombre, descripcion, estado, creado_en, actualizado_en, eliminado_en) VALUES ($3, $1, $2, NULL, $4, NOW(), NOW(), NULL) ON CONFLICT (codigo) DO NOTHING",
      [codigo, nombre, randomUUID(), "ACTIVO"],
    );
  }

  const permisosDb = await pgm.db.query("SELECT id, codigo FROM permisos");
  const rolesDb = await pgm.db.query("SELECT id, codigo FROM roles");
  const permisosPorCodigo = Object.fromEntries(
    permisosDb.rows.map((fila) => [fila.codigo, fila.id]),
  );
  const rolesPorCodigo = Object.fromEntries(
    rolesDb.rows.map((fila) => [fila.codigo, fila.id]),
  );

  const todosLosPermisos = Object.keys(permisosPorCodigo);
  const mapaPermisosRol = {
    PROPIETARIO: todosLosPermisos,
    ADMINISTRADOR: todosLosPermisos,
    EDITOR: [
      "MARCAS_LEER",
      "MARCAS_GESTIONAR",
      "CANALES_LEER",
      "CANALES_GESTIONAR",
      "EMPRESAS_LEER",
      "EMPRESAS_GESTIONAR",
      "OPCIONES_MENU_LEER",
      "OPCIONES_MENU_GESTIONAR",
    ],
    LECTOR: [
      "USUARIOS_LEER",
      "ROLES_LEER",
      "AUDITORIA_LEER",
      "MARCAS_LEER",
      "CANALES_LEER",
      "EMPRESAS_LEER",
      "OPCIONES_MENU_LEER",
    ],
    CLIENTE: [],
  };

  for (const [rolCodigo, permisos] of Object.entries(mapaPermisosRol)) {
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
    "DELETE FROM roles_permisos WHERE rol_id IN (SELECT id FROM roles WHERE codigo = ANY($1))",
    [["PROPIETARIO", "ADMINISTRADOR", "EDITOR", "LECTOR", "CLIENTE"]],
  );

  await pgm.db.query("DELETE FROM roles WHERE codigo IN ($1,$2,$3,$4,$5)", [
    "PROPIETARIO",
    "ADMINISTRADOR",
    "EDITOR",
    "LECTOR",
    "CLIENTE",
  ]);
  await pgm.db.query("DELETE FROM permisos WHERE codigo = ANY($1)", [
    [
      "USUARIOS_LEER",
      "USUARIOS_GESTIONAR",
      "ROLES_LEER",
      "ROLES_GESTIONAR",
      "AUDITORIA_LEER",
      "MARCAS_LEER",
      "MARCAS_GESTIONAR",
      "CANALES_LEER",
      "CANALES_GESTIONAR",
      "EMPRESAS_LEER",
      "EMPRESAS_GESTIONAR",
      "OPCIONES_MENU_LEER",
      "OPCIONES_MENU_GESTIONAR",
    ],
  ]);
};
