exports.up = (pgm) => {
  pgm.createType(
    "estado_usuario",
    ["ACTIVO", "INACTIVO", "BLOQUEADO", "ARCHIVADO"],
    { ifNotExists: true },
  );
  pgm.createType("estado_marca", ["ACTIVA", "INACTIVA", "ARCHIVADA"], {
    ifNotExists: true,
  });
  pgm.createType("estado_canal", ["ACTIVO", "INACTIVO", "ARCHIVADO"], {
    ifNotExists: true,
  });
  pgm.createType("estado_empresa", ["ACTIVA", "INACTIVA", "ARCHIVADA"], {
    ifNotExists: true,
  });

  pgm.createTable("usuarios", {
    id: { type: "uuid", primaryKey: true },
    correo: { type: "text", notNull: true },
    hash_contrasena: { type: "text", notNull: true },
    nombre: { type: "text", notNull: true },
    estado: { type: "estado_usuario", notNull: true, default: "ACTIVO" },
    ultimo_acceso_en: { type: "timestamptz", notNull: false },
    creado_en: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    actualizado_en: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    eliminado_en: { type: "timestamptz", notNull: false },
  });
  pgm.createIndex("usuarios", "correo");
  pgm.createIndex("usuarios", "estado");
  pgm.createIndex("usuarios", "eliminado_en");
  pgm.addConstraint("usuarios", "usuarios_correo_normalizado_unico", {
    unique: ["correo"],
  });

  pgm.createTable("roles", {
    id: { type: "uuid", primaryKey: true },
    codigo: { type: "text", notNull: true },
    nombre: { type: "text", notNull: true },
    descripcion: { type: "text", notNull: false },
    estado: { type: "text", notNull: true, default: "ACTIVO" },
    creado_en: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    actualizado_en: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    eliminado_en: { type: "timestamptz", notNull: false },
  });
  pgm.createIndex("roles", "codigo");
  pgm.addConstraint("roles", "roles_codigo_unico", { unique: ["codigo"] });

  pgm.createTable("permisos", {
    id: { type: "uuid", primaryKey: true },
    codigo: { type: "text", notNull: true },
    nombre: { type: "text", notNull: true },
    descripcion: { type: "text", notNull: false },
    creado_en: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.createIndex("permisos", "codigo");
  pgm.addConstraint("permisos", "permisos_codigo_unico", {
    unique: ["codigo"],
  });

  pgm.createTable("usuarios_roles", {
    usuario_id: {
      type: "uuid",
      notNull: true,
      references: "usuarios",
      onDelete: "RESTRICT",
    },
    rol_id: {
      type: "uuid",
      notNull: true,
      references: "roles",
      onDelete: "RESTRICT",
    },
    creado_en: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.addConstraint("usuarios_roles", "usuarios_roles_unico", {
    unique: ["usuario_id", "rol_id"],
  });
  pgm.createIndex("usuarios_roles", "usuario_id");
  pgm.createIndex("usuarios_roles", "rol_id");

  pgm.createTable("roles_permisos", {
    rol_id: {
      type: "uuid",
      notNull: true,
      references: "roles",
      onDelete: "RESTRICT",
    },
    permiso_id: {
      type: "uuid",
      notNull: true,
      references: "permisos",
      onDelete: "RESTRICT",
    },
    creado_en: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.addConstraint("roles_permisos", "roles_permisos_unico", {
    unique: ["rol_id", "permiso_id"],
  });
  pgm.createIndex("roles_permisos", "rol_id");
  pgm.createIndex("roles_permisos", "permiso_id");
};

exports.down = (pgm) => {
  pgm.dropTable("roles_permisos", { ifExists: true });
  pgm.dropTable("usuarios_roles", { ifExists: true });
  pgm.dropTable("permisos", { ifExists: true });
  pgm.dropTable("roles", { ifExists: true });
  pgm.dropTable("usuarios", { ifExists: true });
  pgm.dropType("estado_empresa", { ifExists: true });
  pgm.dropType("estado_canal", { ifExists: true });
  pgm.dropType("estado_marca", { ifExists: true });
  pgm.dropType("estado_usuario", { ifExists: true });
};
