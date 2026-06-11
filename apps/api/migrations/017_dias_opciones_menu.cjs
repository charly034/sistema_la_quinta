exports.up = (pgm) => {
  // Crear tabla dias_version_menu
  pgm.createTable("dias_version_menu", {
    id: { type: "uuid", primaryKey: true },
    version_semana_id: {
      type: "uuid",
      notNull: true,
      references: "versiones_semana_menu",
      onDelete: "RESTRICT",
    },
    fecha: { type: "date", notNull: true },
    numero_dia_iso: { type: "integer", notNull: true },
    nombre_dia: { type: "text", notNull: true },
    estado_dia: { type: "text", notNull: true, default: "SIN_CONFIGURAR" },
    texto_estado: { type: "text", notNull: false },
    observaciones: { type: "text", notNull: false },
    orden: { type: "integer", notNull: true },
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
  });

  // Restricción: estado_dia válido
  pgm.sql(`
    ALTER TABLE dias_version_menu ADD CONSTRAINT dias_version_menu_estado_valido CHECK (
      estado_dia IN ('DIA_LABORAL', 'FERIADO', 'CERRADO', 'SIN_CONFIGURAR')
    )
  `);

  // Restricción: numero_dia_iso entre 1 y 7
  pgm.sql(`
    ALTER TABLE dias_version_menu ADD CONSTRAINT dias_version_menu_numero_dia_valido CHECK (
      numero_dia_iso BETWEEN 1 AND 7
    )
  `);

  // Restricción: orden entre 1 y 7
  pgm.sql(`
    ALTER TABLE dias_version_menu ADD CONSTRAINT dias_version_menu_orden_valido CHECK (
      orden BETWEEN 1 AND 7
    )
  `);

  // Restricción: no puede haber dos filas para la misma fecha y versión
  pgm.addConstraint("dias_version_menu", "dias_version_menu_fecha_unica", {
    unique: ["version_semana_id", "fecha"],
  });

  // Crear tabla opciones_dia_menu
  pgm.createTable("opciones_dia_menu", {
    id: { type: "uuid", primaryKey: true },
    dia_version_menu_id: {
      type: "uuid",
      notNull: true,
      references: "dias_version_menu",
      onDelete: "RESTRICT",
    },
    opcion_menu_marca_id: {
      type: "uuid",
      notNull: true,
      references: "opciones_menu_marca",
      onDelete: "RESTRICT",
    },
    codigo_opcion: { type: "text", notNull: true },
    nombre_opcion: { type: "text", notNull: true },
    plato_id: {
      type: "uuid",
      notNull: true,
      references: "platos",
      onDelete: "RESTRICT",
    },
    orden: { type: "integer", notNull: true, default: 0 },
    bloqueado_manual: { type: "boolean", notNull: true, default: false },
    observaciones: { type: "text", notNull: false },
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
  });

  // Restricción: no puede repetirse la misma opción dentro del mismo día
  pgm.addConstraint(
    "opciones_dia_menu",
    "opciones_dia_menu_opcion_unica_por_dia",
    {
      unique: ["dia_version_menu_id", "codigo_opcion"],
    },
  );

  // Índices
  pgm.createIndex("dias_version_menu", "version_semana_id");
  pgm.createIndex("dias_version_menu", "fecha");
  pgm.createIndex("dias_version_menu", "estado_dia");
  pgm.createIndex("opciones_dia_menu", "dia_version_menu_id");
  pgm.createIndex("opciones_dia_menu", "plato_id");
  pgm.createIndex("opciones_dia_menu", "opcion_menu_marca_id");
};

exports.down = (pgm) => {
  pgm.dropTable("opciones_dia_menu", { ifExists: true });
  pgm.dropTable("dias_version_menu", { ifExists: true });
};
