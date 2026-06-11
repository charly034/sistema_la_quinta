exports.up = (pgm) => {
  // Crear tabla versiones_semana_menu PRIMERO (sin referencia a semanas_menu)
  pgm.createTable("versiones_semana_menu", {
    id: { type: "uuid", primaryKey: true },
    semana_menu_id: { type: "uuid", notNull: true },
    numero_version: { type: "integer", notNull: true },
    estado: { type: "text", notNull: true, default: "BORRADOR" },
    es_actual: { type: "boolean", notNull: true, default: false },
    es_publicada_actual: { type: "boolean", notNull: true, default: false },
    origen_version_id: {
      type: "uuid",
      notNull: false,
      references: "versiones_semana_menu",
      onDelete: "SET NULL",
    },
    observaciones: { type: "text", notNull: false },
    motivo_cambio: { type: "text", notNull: false },
    creado_por: { type: "uuid", notNull: true, references: "usuarios" },
    aprobado_por: { type: "uuid", notNull: false, references: "usuarios" },
    publicado_por: { type: "uuid", notNull: false, references: "usuarios" },
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
    aprobado_en: { type: "timestamptz", notNull: false },
    publicado_en: { type: "timestamptz", notNull: false },
    finalizado_en: { type: "timestamptz", notNull: false },
    cancelado_en: { type: "timestamptz", notNull: false },
  });

  // Crear tabla semanas_menu DESPUÉS
  pgm.createTable("semanas_menu", {
    id: { type: "uuid", primaryKey: true },
    marca_id: {
      type: "uuid",
      notNull: true,
      references: "marcas",
      onDelete: "RESTRICT",
    },
    canal_id: {
      type: "uuid",
      notNull: false,
      references: "canales",
      onDelete: "SET NULL",
    },
    empresa_id: {
      type: "uuid",
      notNull: false,
      references: "empresas",
      onDelete: "SET NULL",
    },
    fecha_inicio: { type: "date", notNull: true },
    fecha_fin: { type: "date", notNull: true },
    version_actual_id: {
      type: "uuid",
      notNull: false,
      references: "versiones_semana_menu",
      onDelete: "SET NULL",
    },
    version_publicada_id: {
      type: "uuid",
      notNull: false,
      references: "versiones_semana_menu",
      onDelete: "SET NULL",
    },
    creado_por: { type: "uuid", notNull: true, references: "usuarios" },
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

  // Añadir restricción FK a semana_menu_id en versiones_semana_menu con SQL directo
  pgm.sql(`
    ALTER TABLE versiones_semana_menu
    ADD CONSTRAINT versiones_semana_menu_semana_fk
    FOREIGN KEY (semana_menu_id) REFERENCES semanas_menu(id) ON DELETE RESTRICT
  `);

  // Restricción: fecha_inicio es lunes (DOW=1), fecha_fin es domingo (DOW=0), diferencia exacta de 6 días
  pgm.sql(`
    ALTER TABLE semanas_menu
    ADD CONSTRAINT semanas_menu_fechas_validas CHECK (
      EXTRACT(DOW FROM fecha_inicio) = 1 AND
      EXTRACT(DOW FROM fecha_fin) = 0 AND
      fecha_fin - fecha_inicio = 6
    )
  `);

  // Restricción: estado válido en versiones
  pgm.sql(`
    ALTER TABLE versiones_semana_menu
    ADD CONSTRAINT versiones_semana_menu_estado_valido CHECK (
      estado IN ('BORRADOR', 'PROPUESTO', 'APROBADO', 'PUBLICADO', 'FINALIZADO', 'CANCELADO')
    )
  `);

  // Restricción: número de versión único por semana
  pgm.addConstraint(
    "versiones_semana_menu",
    "versiones_semana_menu_numero_unico",
    {
      unique: ["semana_menu_id", "numero_version"],
    },
  );

  // Índices usando SQL directo para soporte de IF NOT EXISTS
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS "semanas_menu_marca_id_index" ON "semanas_menu" ("marca_id");
    CREATE INDEX IF NOT EXISTS "semanas_menu_canal_id_index" ON "semanas_menu" ("canal_id");
    CREATE INDEX IF NOT EXISTS "semanas_menu_empresa_id_index" ON "semanas_menu" ("empresa_id");
    CREATE INDEX IF NOT EXISTS "semanas_menu_fecha_inicio_index" ON "semanas_menu" ("fecha_inicio");
    CREATE INDEX IF NOT EXISTS "semanas_menu_version_actual_id_index" ON "semanas_menu" ("version_actual_id");
    CREATE INDEX IF NOT EXISTS "semanas_menu_version_publicada_id_index" ON "semanas_menu" ("version_publicada_id");
    CREATE INDEX IF NOT EXISTS "versiones_semana_menu_semana_menu_id_index" ON "versiones_semana_menu" ("semana_menu_id");
    CREATE INDEX IF NOT EXISTS "versiones_semana_menu_estado_index" ON "versiones_semana_menu" ("estado");
    CREATE INDEX IF NOT EXISTS "versiones_semana_menu_es_actual_index" ON "versiones_semana_menu" ("es_actual");
    CREATE INDEX IF NOT EXISTS "versiones_semana_menu_es_publicada_actual_index" ON "versiones_semana_menu" ("es_publicada_actual");
    CREATE INDEX IF NOT EXISTS "versiones_semana_menu_creado_en_index" ON "versiones_semana_menu" ("creado_en");
  `);
};

exports.down = (pgm) => {
  pgm.dropTable("semanas_menu", { ifExists: true });
  pgm.dropTable("versiones_semana_menu", { ifExists: true });
};
