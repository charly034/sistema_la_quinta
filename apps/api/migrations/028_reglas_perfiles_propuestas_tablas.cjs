exports.up = (pgm) => {
  pgm.createTable("reglas_menu", {
    id: { type: "uuid", primaryKey: true },
    codigo: { type: "text", notNull: true },
    nombre: { type: "text", notNull: true },
    descripcion: { type: "text", notNull: false },
    tipo: { type: "text", notNull: true },
    naturaleza: { type: "text", notNull: true },
    estado: { type: "text", notNull: true, default: "ACTIVA" },
    prioridad: { type: "integer", notNull: true, default: 0 },
    peso: { type: "numeric(12,4)", notNull: true, default: 0 },
    parametros: { type: "jsonb", notNull: true, default: "{}" },
    marca_id: {
      type: "uuid",
      notNull: false,
      references: "marcas",
      onDelete: "SET NULL",
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
    dia_semana_iso: { type: "smallint", notNull: false },
    vigencia_desde: { type: "date", notNull: false },
    vigencia_hasta: { type: "date", notNull: false },
    mensaje_cumplimiento: { type: "text", notNull: false },
    mensaje_incumplimiento: { type: "text", notNull: false },
    creado_por: {
      type: "uuid",
      notNull: true,
      references: "usuarios",
      onDelete: "RESTRICT",
    },
    actualizado_por: {
      type: "uuid",
      notNull: true,
      references: "usuarios",
      onDelete: "RESTRICT",
    },
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

  pgm.sql(
    "ALTER TABLE reglas_menu ADD CONSTRAINT reglas_menu_estado_valido CHECK (estado IN ('ACTIVA','INACTIVA','ARCHIVADA'))",
  );
  pgm.sql(
    "ALTER TABLE reglas_menu ADD CONSTRAINT reglas_menu_naturaleza_valida CHECK (naturaleza IN ('OBLIGATORIA','PREFERENCIAL'))",
  );
  pgm.sql(
    "ALTER TABLE reglas_menu ADD CONSTRAINT reglas_menu_prioridad_no_negativa CHECK (prioridad >= 0)",
  );
  pgm.sql(
    "ALTER TABLE reglas_menu ADD CONSTRAINT reglas_menu_dia_semana_iso_valido CHECK (dia_semana_iso IS NULL OR dia_semana_iso BETWEEN 1 AND 7)",
  );
  pgm.sql(
    "ALTER TABLE reglas_menu ADD CONSTRAINT reglas_menu_vigencia_valida CHECK (vigencia_desde IS NULL OR vigencia_hasta IS NULL OR vigencia_desde <= vigencia_hasta)",
  );

  pgm.createTable("perfiles_reglas", {
    id: { type: "uuid", primaryKey: true },
    codigo: { type: "text", notNull: true },
    nombre: { type: "text", notNull: true },
    descripcion: { type: "text", notNull: false },
    estado: { type: "text", notNull: true, default: "ACTIVO" },
    marca_id: {
      type: "uuid",
      notNull: false,
      references: "marcas",
      onDelete: "SET NULL",
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
    es_predeterminado: { type: "boolean", notNull: true, default: false },
    creado_por: {
      type: "uuid",
      notNull: true,
      references: "usuarios",
      onDelete: "RESTRICT",
    },
    actualizado_por: {
      type: "uuid",
      notNull: true,
      references: "usuarios",
      onDelete: "RESTRICT",
    },
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

  pgm.sql(
    "ALTER TABLE perfiles_reglas ADD CONSTRAINT perfiles_reglas_estado_valido CHECK (estado IN ('ACTIVO','INACTIVO','ARCHIVADO'))",
  );

  pgm.createTable("perfiles_reglas_detalle", {
    id: { type: "uuid", primaryKey: true },
    perfil_id: {
      type: "uuid",
      notNull: true,
      references: "perfiles_reglas",
      onDelete: "RESTRICT",
    },
    regla_id: {
      type: "uuid",
      notNull: true,
      references: "reglas_menu",
      onDelete: "RESTRICT",
    },
    orden: { type: "integer", notNull: true, default: 0 },
    activa: { type: "boolean", notNull: true, default: true },
    peso_personalizado: { type: "numeric(12,4)", notNull: false },
    prioridad_personalizada: { type: "integer", notNull: false },
    parametros_personalizados: { type: "jsonb", notNull: false },
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

  pgm.addConstraint(
    "perfiles_reglas_detalle",
    "perfiles_reglas_detalle_unico",
    {
      unique: ["perfil_id", "regla_id"],
    },
  );
  pgm.sql(
    "ALTER TABLE perfiles_reglas_detalle ADD CONSTRAINT perfiles_reglas_detalle_orden_no_negativo CHECK (orden >= 0)",
  );
  pgm.sql(
    "ALTER TABLE perfiles_reglas_detalle ADD CONSTRAINT perfiles_reglas_detalle_prioridad_no_negativa CHECK (prioridad_personalizada IS NULL OR prioridad_personalizada >= 0)",
  );

  pgm.createTable("propuestas_menu", {
    id: { type: "uuid", primaryKey: true },
    semana_menu_id: {
      type: "uuid",
      notNull: true,
      references: "semanas_menu",
      onDelete: "RESTRICT",
    },
    version_semana_id: {
      type: "uuid",
      notNull: true,
      references: "versiones_semana_menu",
      onDelete: "RESTRICT",
    },
    perfil_reglas_id: {
      type: "uuid",
      notNull: false,
      references: "perfiles_reglas",
      onDelete: "SET NULL",
    },
    tipo: { type: "text", notNull: true },
    estado: { type: "text", notNull: true, default: "GENERADA" },
    puntaje_total: { type: "numeric(14,4)", notNull: true, default: 0 },
    semilla: { type: "text", notNull: true },
    parametros_generacion: { type: "jsonb", notNull: true, default: "{}" },
    resumen: { type: "jsonb", notNull: true, default: "{}" },
    reglas_incumplidas: { type: "jsonb", notNull: true, default: "[]" },
    version_actualizada_en: { type: "timestamptz", notNull: false },
    version_huella: { type: "text", notNull: false },
    creado_por: {
      type: "uuid",
      notNull: true,
      references: "usuarios",
      onDelete: "RESTRICT",
    },
    aprobado_por: {
      type: "uuid",
      notNull: false,
      references: "usuarios",
      onDelete: "SET NULL",
    },
    motivo_descarte: { type: "text", notNull: false },
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
    descartado_en: { type: "timestamptz", notNull: false },
  });

  pgm.sql(
    "ALTER TABLE propuestas_menu ADD CONSTRAINT propuestas_menu_tipo_valido CHECK (tipo IN ('EQUILIBRADA','HISTORICA','RENOVACION','PERSONALIZADA'))",
  );
  pgm.sql(
    "ALTER TABLE propuestas_menu ADD CONSTRAINT propuestas_menu_estado_valido CHECK (estado IN ('GENERADA','APROBADA','APLICADA','DESCARTADA','INVALIDA'))",
  );

  pgm.createTable("propuestas_menu_detalle", {
    id: { type: "uuid", primaryKey: true },
    propuesta_id: {
      type: "uuid",
      notNull: true,
      references: "propuestas_menu",
      onDelete: "RESTRICT",
    },
    dia_version_menu_id: {
      type: "uuid",
      notNull: true,
      references: "dias_version_menu",
      onDelete: "RESTRICT",
    },
    fecha: { type: "date", notNull: true },
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
      notNull: false,
      references: "platos",
      onDelete: "SET NULL",
    },
    puntaje: { type: "numeric(14,4)", notNull: true, default: 0 },
    posicion_bloqueada: { type: "boolean", notNull: true, default: false },
    seleccionado_manual: { type: "boolean", notNull: true, default: false },
    explicacion: { type: "jsonb", notNull: true, default: "{}" },
    metricas: { type: "jsonb", notNull: true, default: "{}" },
    orden: { type: "integer", notNull: true, default: 0 },
    creado_en: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.addConstraint(
    "propuestas_menu_detalle",
    "propuestas_menu_detalle_posicion_unica",
    {
      unique: ["propuesta_id", "dia_version_menu_id", "opcion_menu_marca_id"],
    },
  );

  pgm.sql(
    "ALTER TABLE propuestas_menu_detalle ADD CONSTRAINT propuestas_menu_detalle_orden_no_negativo CHECK (orden >= 0)",
  );

  pgm.sql(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_reglas_menu_codigo_contexto_unico
    ON reglas_menu (
      lower(codigo),
      COALESCE(marca_id::text, ''),
      COALESCE(canal_id::text, ''),
      COALESCE(empresa_id::text, ''),
      COALESCE(dia_semana_iso, 0)
    )
    WHERE eliminado_en IS NULL;

    CREATE INDEX IF NOT EXISTS idx_reglas_menu_estado_tipo_contexto ON reglas_menu (estado, tipo, marca_id, canal_id, empresa_id);
    CREATE INDEX IF NOT EXISTS idx_reglas_menu_vigencia ON reglas_menu (vigencia_desde, vigencia_hasta);
    CREATE INDEX IF NOT EXISTS idx_perfiles_reglas_codigo_contexto ON perfiles_reglas (lower(codigo), marca_id, canal_id, empresa_id);
    CREATE INDEX IF NOT EXISTS idx_perfiles_reglas_estado ON perfiles_reglas (estado);
    CREATE INDEX IF NOT EXISTS idx_propuestas_menu_semana_version_estado ON propuestas_menu (semana_menu_id, version_semana_id, estado);
    CREATE INDEX IF NOT EXISTS idx_propuestas_menu_perfil ON propuestas_menu (perfil_reglas_id);
    CREATE INDEX IF NOT EXISTS idx_propuestas_menu_semilla ON propuestas_menu (semilla);
    CREATE INDEX IF NOT EXISTS idx_propuestas_menu_creado_en ON propuestas_menu (creado_en);
    CREATE INDEX IF NOT EXISTS idx_propuestas_menu_detalle_propuesta_fecha ON propuestas_menu_detalle (propuesta_id, fecha);
    CREATE INDEX IF NOT EXISTS idx_propuestas_menu_detalle_plato ON propuestas_menu_detalle (plato_id);
  `);
};

exports.down = (pgm) => {
  pgm.dropTable("propuestas_menu_detalle", { ifExists: true });
  pgm.dropTable("propuestas_menu", { ifExists: true });
  pgm.dropTable("perfiles_reglas_detalle", { ifExists: true });
  pgm.dropTable("perfiles_reglas", { ifExists: true });
  pgm.dropTable("reglas_menu", { ifExists: true });
};
