exports.up = (pgm) => {
  pgm.createTable("marcas", {
    id: { type: "uuid", primaryKey: true },
    codigo: { type: "text", notNull: true },
    nombre: { type: "text", notNull: true },
    descripcion: { type: "text", notNull: false },
    estado: { type: "estado_marca", notNull: true, default: "ACTIVA" },
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
  pgm.createIndex("marcas", "codigo");
  pgm.createIndex("marcas", "estado");
  pgm.addConstraint("marcas", "marcas_codigo_unico", { unique: ["codigo"] });

  pgm.createTable("canales", {
    id: { type: "uuid", primaryKey: true },
    codigo: { type: "text", notNull: true },
    nombre: { type: "text", notNull: true },
    descripcion: { type: "text", notNull: false },
    estado: { type: "estado_canal", notNull: true, default: "ACTIVO" },
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
  pgm.createIndex("canales", "codigo");
  pgm.addConstraint("canales", "canales_codigo_unico", { unique: ["codigo"] });

  pgm.createTable("empresas", {
    id: { type: "uuid", primaryKey: true },
    codigo: { type: "text", notNull: true },
    nombre: { type: "text", notNull: true },
    descripcion: { type: "text", notNull: false },
    estado: { type: "estado_empresa", notNull: true, default: "ACTIVA" },
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
  pgm.createIndex("empresas", "codigo");
  pgm.addConstraint("empresas", "empresas_codigo_unico", {
    unique: ["codigo"],
  });

  pgm.createTable("empresas_marcas", {
    empresa_id: {
      type: "uuid",
      notNull: true,
      references: "empresas",
      onDelete: "RESTRICT",
    },
    marca_id: {
      type: "uuid",
      notNull: true,
      references: "marcas",
      onDelete: "RESTRICT",
    },
    creado_en: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.addConstraint("empresas_marcas", "empresas_marcas_unico", {
    unique: ["empresa_id", "marca_id"],
  });
  pgm.createIndex("empresas_marcas", "empresa_id");
  pgm.createIndex("empresas_marcas", "marca_id");

  pgm.createTable("opciones_menu_marca", {
    id: { type: "uuid", primaryKey: true },
    marca_id: {
      type: "uuid",
      notNull: true,
      references: "marcas",
      onDelete: "RESTRICT",
    },
    codigo: { type: "text", notNull: true },
    nombre: { type: "text", notNull: true },
    descripcion: { type: "text", notNull: false },
    orden: { type: "integer", notNull: true, default: 0 },
    estado: { type: "text", notNull: true, default: "ACTIVA" },
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
  pgm.addConstraint("opciones_menu_marca", "opciones_menu_marca_codigo_unico", {
    unique: ["marca_id", "codigo"],
  });
  pgm.createIndex("opciones_menu_marca", "marca_id");
  pgm.createIndex("opciones_menu_marca", "estado");
};

exports.down = (pgm) => {
  pgm.dropTable("opciones_menu_marca", { ifExists: true });
  pgm.dropTable("empresas_marcas", { ifExists: true });
  pgm.dropTable("empresas", { ifExists: true });
  pgm.dropTable("canales", { ifExists: true });
  pgm.dropTable("marcas", { ifExists: true });
};
