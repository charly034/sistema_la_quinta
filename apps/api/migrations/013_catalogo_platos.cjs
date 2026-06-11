const CHECK_TIPO_PLATO =
  "tipo IN ('PREPARACION','GUARNICION','PLATO_COMPLETO')";
const CHECK_ESTADO_PLATO =
  "estado IN ('ACTIVO','INACTIVO','ESTACIONAL','BLOQUEADO_TEMPORALMENTE','ARCHIVADO')";
const CHECK_FUNCION_COMPONENTE =
  "funcion IN ('PRINCIPAL','GUARNICION','SALSA','ACOMPANAMIENTO','OTRO')";
const CHECK_TIPO_PRESENCIA_ALERGENO =
  "tipo_presencia IN ('CONTIENE','PUEDE_CONTENER','TRAZAS')";
const CHECK_ESTADO_VALIDACION_CARACTERISTICA =
  "estado_validacion IN ('CONFIRMADO','NO_APTO','SIN_VERIFICAR')";

exports.up = (pgm) => {
  pgm.createTable("platos", {
    id: { type: "uuid", primaryKey: true },
    marca_id: {
      type: "uuid",
      notNull: true,
      references: "marcas",
      onDelete: "RESTRICT",
    },
    tipo: { type: "text", notNull: true },
    codigo: { type: "text", notNull: false },
    nombre: { type: "text", notNull: true },
    nombre_normalizado: { type: "text", notNull: true },
    descripcion_comercial: { type: "text", notNull: false },
    descripcion_interna: { type: "text", notNull: false },
    estado: { type: "text", notNull: true, default: "ACTIVO" },
    favorito: { type: "boolean", notNull: true, default: false },
    apto_freezer: { type: "boolean", notNull: false },
    es_estacional: { type: "boolean", notNull: true, default: false },
    temporada_desde: { type: "smallint", notNull: false },
    temporada_hasta: { type: "smallint", notNull: false },
    bloqueado_desde: { type: "timestamptz", notNull: false },
    bloqueado_hasta: { type: "timestamptz", notNull: false },
    motivo_bloqueo: { type: "text", notNull: false },
    tiempo_preparacion_minutos: { type: "integer", notNull: false },
    dificultad: { type: "text", notNull: false },
    porcion_referencia_gramos: { type: "numeric(10,2)", notNull: false },
    costo_referencia: { type: "numeric(12,2)", notNull: false },
    precio_referencia: { type: "numeric(12,2)", notNull: false },
    imagen_url: { type: "text", notNull: false },
    observaciones: { type: "text", notNull: false },
    creado_por: {
      type: "uuid",
      notNull: false,
      references: "usuarios",
      onDelete: "RESTRICT",
    },
    actualizado_por: {
      type: "uuid",
      notNull: false,
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
    "ALTER TABLE platos ADD CONSTRAINT platos_tipo_valido CHECK (" +
      CHECK_TIPO_PLATO +
      ")",
  );
  pgm.sql(
    "ALTER TABLE platos ADD CONSTRAINT platos_estado_valido CHECK (" +
      CHECK_ESTADO_PLATO +
      ")",
  );
  pgm.sql(
    "ALTER TABLE platos ADD CONSTRAINT platos_nombre_no_vacio CHECK (length(trim(nombre)) > 0)",
  );
  pgm.sql(
    "ALTER TABLE platos ADD CONSTRAINT platos_nombre_normalizado_no_vacio CHECK (length(trim(nombre_normalizado)) > 0)",
  );
  pgm.sql(
    "ALTER TABLE platos ADD CONSTRAINT platos_tiempo_preparacion_no_negativo CHECK (tiempo_preparacion_minutos IS NULL OR tiempo_preparacion_minutos >= 0)",
  );
  pgm.sql(
    "ALTER TABLE platos ADD CONSTRAINT platos_porcion_no_negativa CHECK (porcion_referencia_gramos IS NULL OR porcion_referencia_gramos >= 0)",
  );
  pgm.sql(
    "ALTER TABLE platos ADD CONSTRAINT platos_costo_no_negativo CHECK (costo_referencia IS NULL OR costo_referencia >= 0)",
  );
  pgm.sql(
    "ALTER TABLE platos ADD CONSTRAINT platos_precio_no_negativo CHECK (precio_referencia IS NULL OR precio_referencia >= 0)",
  );
  pgm.sql(
    "ALTER TABLE platos ADD CONSTRAINT platos_temporada_valida CHECK ((temporada_desde IS NULL AND temporada_hasta IS NULL) OR (temporada_desde BETWEEN 1 AND 12 AND temporada_hasta BETWEEN 1 AND 12))",
  );

  pgm.sql(
    "CREATE UNIQUE INDEX IF NOT EXISTS platos_codigo_unico_por_marca ON platos (marca_id, lower(codigo)) WHERE codigo IS NOT NULL AND eliminado_en IS NULL",
  );
  pgm.sql(
    "CREATE UNIQUE INDEX IF NOT EXISTS platos_duplicado_exacto_activo ON platos (marca_id, tipo, nombre_normalizado) WHERE eliminado_en IS NULL AND estado <> 'ARCHIVADO'",
  );
  pgm.createIndex("platos", ["marca_id"]);
  pgm.createIndex("platos", ["tipo"]);
  pgm.createIndex("platos", ["estado"]);
  pgm.createIndex("platos", ["favorito"]);
  pgm.createIndex("platos", ["nombre_normalizado"]);
  pgm.createIndex("platos", ["eliminado_en"]);

  pgm.createTable("componentes_plato", {
    id: { type: "uuid", primaryKey: true },
    plato_compuesto_id: {
      type: "uuid",
      notNull: true,
      references: "platos",
      onDelete: "RESTRICT",
    },
    plato_componente_id: {
      type: "uuid",
      notNull: true,
      references: "platos",
      onDelete: "RESTRICT",
    },
    funcion: { type: "text", notNull: true },
    orden: { type: "integer", notNull: true, default: 0 },
    cantidad_referencia: { type: "numeric(10,2)", notNull: false },
    unidad_referencia: { type: "text", notNull: false },
    es_principal: { type: "boolean", notNull: true, default: false },
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
  pgm.addConstraint("componentes_plato", "componentes_plato_unico", {
    unique: ["plato_compuesto_id", "plato_componente_id"],
  });
  pgm.sql(
    "ALTER TABLE componentes_plato ADD CONSTRAINT componentes_plato_funcion_valida CHECK (" +
      CHECK_FUNCION_COMPONENTE +
      ")",
  );
  pgm.sql(
    "ALTER TABLE componentes_plato ADD CONSTRAINT componentes_plato_orden_no_negativo CHECK (orden >= 0)",
  );
  pgm.sql(
    "ALTER TABLE componentes_plato ADD CONSTRAINT componentes_plato_cantidad_no_negativa CHECK (cantidad_referencia IS NULL OR cantidad_referencia >= 0)",
  );
  pgm.sql(
    "ALTER TABLE componentes_plato ADD CONSTRAINT componentes_plato_no_autorreferencia CHECK (plato_compuesto_id <> plato_componente_id)",
  );
  pgm.createIndex("componentes_plato", ["plato_compuesto_id"]);
  pgm.createIndex("componentes_plato", ["plato_componente_id"]);

  pgm.createTable("alias_platos", {
    id: { type: "uuid", primaryKey: true },
    plato_id: {
      type: "uuid",
      notNull: true,
      references: "platos",
      onDelete: "RESTRICT",
    },
    alias: { type: "text", notNull: true },
    alias_normalizado: { type: "text", notNull: true },
    creado_en: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.addConstraint("alias_platos", "alias_platos_unico", {
    unique: ["plato_id", "alias_normalizado"],
  });
  pgm.sql(
    "ALTER TABLE alias_platos ADD CONSTRAINT alias_platos_alias_no_vacio CHECK (length(trim(alias)) > 0)",
  );
  pgm.sql(
    "ALTER TABLE alias_platos ADD CONSTRAINT alias_platos_alias_normalizado_no_vacio CHECK (length(trim(alias_normalizado)) > 0)",
  );
  pgm.createIndex("alias_platos", ["alias_normalizado"]);
  pgm.createIndex("alias_platos", ["plato_id"]);

  pgm.createTable("categorias_plato", {
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
    estado: { type: "text", notNull: true, default: "ACTIVA" },
    orden: { type: "integer", notNull: true, default: 0 },
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
    "ALTER TABLE categorias_plato ADD CONSTRAINT categorias_plato_estado_valido CHECK (estado IN ('ACTIVA','INACTIVA','ARCHIVADA'))",
  );
  pgm.sql(
    "ALTER TABLE categorias_plato ADD CONSTRAINT categorias_plato_orden_no_negativo CHECK (orden >= 0)",
  );
  pgm.sql(
    "CREATE UNIQUE INDEX IF NOT EXISTS categorias_plato_codigo_unico_por_marca ON categorias_plato (marca_id, lower(codigo)) WHERE eliminado_en IS NULL",
  );
  pgm.createIndex("categorias_plato", ["marca_id"]);
  pgm.createIndex("categorias_plato", ["estado"]);

  pgm.createTable("platos_categorias", {
    plato_id: {
      type: "uuid",
      notNull: true,
      references: "platos",
      onDelete: "RESTRICT",
    },
    categoria_id: {
      type: "uuid",
      notNull: true,
      references: "categorias_plato",
      onDelete: "RESTRICT",
    },
    creado_en: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.addConstraint("platos_categorias", "platos_categorias_unico", {
    unique: ["plato_id", "categoria_id"],
  });
  pgm.createIndex("platos_categorias", ["plato_id"]);
  pgm.createIndex("platos_categorias", ["categoria_id"]);

  pgm.createTable("proteinas", {
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
  pgm.sql(
    "ALTER TABLE proteinas ADD CONSTRAINT proteinas_estado_valido CHECK (estado IN ('ACTIVA','INACTIVA','ARCHIVADA'))",
  );
  pgm.sql(
    "CREATE UNIQUE INDEX IF NOT EXISTS proteinas_codigo_unico_por_marca ON proteinas (marca_id, lower(codigo)) WHERE eliminado_en IS NULL",
  );
  pgm.createIndex("proteinas", ["marca_id"]);
  pgm.createIndex("proteinas", ["estado"]);

  pgm.createTable("platos_proteinas", {
    plato_id: {
      type: "uuid",
      notNull: true,
      references: "platos",
      onDelete: "RESTRICT",
    },
    proteina_id: {
      type: "uuid",
      notNull: true,
      references: "proteinas",
      onDelete: "RESTRICT",
    },
    creado_en: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.addConstraint("platos_proteinas", "platos_proteinas_unico", {
    unique: ["plato_id", "proteina_id"],
  });
  pgm.createIndex("platos_proteinas", ["plato_id"]);
  pgm.createIndex("platos_proteinas", ["proteina_id"]);

  pgm.createTable("etiquetas_plato", {
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
    tipo: { type: "text", notNull: true, default: "OTRA" },
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
  pgm.sql(
    "ALTER TABLE etiquetas_plato ADD CONSTRAINT etiquetas_plato_tipo_valido CHECK (tipo IN ('ALIMENTARIA','COMERCIAL','OPERATIVA','TEMPORAL','OTRA'))",
  );
  pgm.sql(
    "ALTER TABLE etiquetas_plato ADD CONSTRAINT etiquetas_plato_estado_valido CHECK (estado IN ('ACTIVA','INACTIVA','ARCHIVADA'))",
  );
  pgm.sql(
    "CREATE UNIQUE INDEX IF NOT EXISTS etiquetas_plato_codigo_unico_por_marca ON etiquetas_plato (marca_id, lower(codigo)) WHERE eliminado_en IS NULL",
  );
  pgm.createIndex("etiquetas_plato", ["marca_id"]);
  pgm.createIndex("etiquetas_plato", ["estado"]);

  pgm.createTable("platos_etiquetas", {
    plato_id: {
      type: "uuid",
      notNull: true,
      references: "platos",
      onDelete: "RESTRICT",
    },
    etiqueta_id: {
      type: "uuid",
      notNull: true,
      references: "etiquetas_plato",
      onDelete: "RESTRICT",
    },
    creado_en: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.addConstraint("platos_etiquetas", "platos_etiquetas_unico", {
    unique: ["plato_id", "etiqueta_id"],
  });
  pgm.createIndex("platos_etiquetas", ["plato_id"]);
  pgm.createIndex("platos_etiquetas", ["etiqueta_id"]);

  pgm.createTable("ingredientes", {
    id: { type: "uuid", primaryKey: true },
    marca_id: {
      type: "uuid",
      notNull: true,
      references: "marcas",
      onDelete: "RESTRICT",
    },
    codigo: { type: "text", notNull: true },
    nombre: { type: "text", notNull: true },
    nombre_normalizado: { type: "text", notNull: true },
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
  pgm.sql(
    "ALTER TABLE ingredientes ADD CONSTRAINT ingredientes_estado_valido CHECK (estado IN ('ACTIVO','INACTIVO','ARCHIVADO'))",
  );
  pgm.sql(
    "CREATE UNIQUE INDEX IF NOT EXISTS ingredientes_codigo_unico_por_marca ON ingredientes (marca_id, lower(codigo)) WHERE eliminado_en IS NULL",
  );
  pgm.createIndex("ingredientes", ["marca_id"]);
  pgm.createIndex("ingredientes", ["nombre_normalizado"]);
  pgm.createIndex("ingredientes", ["estado"]);

  pgm.createTable("platos_ingredientes", {
    plato_id: {
      type: "uuid",
      notNull: true,
      references: "platos",
      onDelete: "RESTRICT",
    },
    ingrediente_id: {
      type: "uuid",
      notNull: true,
      references: "ingredientes",
      onDelete: "RESTRICT",
    },
    cantidad_referencia: { type: "numeric(10,2)", notNull: false },
    unidad_referencia: { type: "text", notNull: false },
    es_principal: { type: "boolean", notNull: true, default: false },
    es_opcional: { type: "boolean", notNull: true, default: false },
    observaciones: { type: "text", notNull: false },
    creado_en: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.addConstraint("platos_ingredientes", "platos_ingredientes_unico", {
    unique: ["plato_id", "ingrediente_id"],
  });
  pgm.sql(
    "ALTER TABLE platos_ingredientes ADD CONSTRAINT platos_ingredientes_cantidad_no_negativa CHECK (cantidad_referencia IS NULL OR cantidad_referencia >= 0)",
  );
  pgm.createIndex("platos_ingredientes", ["plato_id"]);
  pgm.createIndex("platos_ingredientes", ["ingrediente_id"]);

  pgm.createTable("alergenos", {
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
  pgm.sql(
    "ALTER TABLE alergenos ADD CONSTRAINT alergenos_estado_valido CHECK (estado IN ('ACTIVO','INACTIVO','ARCHIVADO'))",
  );
  pgm.sql(
    "CREATE UNIQUE INDEX IF NOT EXISTS alergenos_codigo_unico ON alergenos (lower(codigo)) WHERE eliminado_en IS NULL",
  );
  pgm.createIndex("alergenos", ["estado"]);

  pgm.createTable("platos_alergenos", {
    plato_id: {
      type: "uuid",
      notNull: true,
      references: "platos",
      onDelete: "RESTRICT",
    },
    alergeno_id: {
      type: "uuid",
      notNull: true,
      references: "alergenos",
      onDelete: "RESTRICT",
    },
    tipo_presencia: { type: "text", notNull: true },
    observaciones: { type: "text", notNull: false },
    creado_en: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.addConstraint("platos_alergenos", "platos_alergenos_unico", {
    unique: ["plato_id", "alergeno_id"],
  });
  pgm.sql(
    "ALTER TABLE platos_alergenos ADD CONSTRAINT platos_alergenos_tipo_presencia_valida CHECK (" +
      CHECK_TIPO_PRESENCIA_ALERGENO +
      ")",
  );
  pgm.createIndex("platos_alergenos", ["plato_id"]);
  pgm.createIndex("platos_alergenos", ["alergeno_id"]);

  pgm.createTable("caracteristicas_alimentarias", {
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
  pgm.sql(
    "ALTER TABLE caracteristicas_alimentarias ADD CONSTRAINT caracteristicas_alimentarias_estado_valido CHECK (estado IN ('ACTIVA','INACTIVA','ARCHIVADA'))",
  );
  pgm.sql(
    "CREATE UNIQUE INDEX IF NOT EXISTS caracteristicas_alimentarias_codigo_unico_por_marca ON caracteristicas_alimentarias (marca_id, lower(codigo)) WHERE eliminado_en IS NULL",
  );
  pgm.createIndex("caracteristicas_alimentarias", ["marca_id"]);
  pgm.createIndex("caracteristicas_alimentarias", ["estado"]);

  pgm.createTable("platos_caracteristicas", {
    plato_id: {
      type: "uuid",
      notNull: true,
      references: "platos",
      onDelete: "RESTRICT",
    },
    caracteristica_id: {
      type: "uuid",
      notNull: true,
      references: "caracteristicas_alimentarias",
      onDelete: "RESTRICT",
    },
    estado_validacion: {
      type: "text",
      notNull: true,
      default: "SIN_VERIFICAR",
    },
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
  pgm.addConstraint("platos_caracteristicas", "platos_caracteristicas_unico", {
    unique: ["plato_id", "caracteristica_id"],
  });
  pgm.sql(
    "ALTER TABLE platos_caracteristicas ADD CONSTRAINT platos_caracteristicas_estado_validacion_valido CHECK (" +
      CHECK_ESTADO_VALIDACION_CARACTERISTICA +
      ")",
  );
  pgm.createIndex("platos_caracteristicas", ["plato_id"]);
  pgm.createIndex("platos_caracteristicas", ["caracteristica_id"]);
};

exports.down = (pgm) => {
  pgm.dropTable("platos_caracteristicas", { ifExists: true });
  pgm.dropTable("caracteristicas_alimentarias", { ifExists: true });
  pgm.dropTable("platos_alergenos", { ifExists: true });
  pgm.dropTable("alergenos", { ifExists: true });
  pgm.dropTable("platos_ingredientes", { ifExists: true });
  pgm.dropTable("ingredientes", { ifExists: true });
  pgm.dropTable("platos_etiquetas", { ifExists: true });
  pgm.dropTable("etiquetas_plato", { ifExists: true });
  pgm.dropTable("platos_proteinas", { ifExists: true });
  pgm.dropTable("proteinas", { ifExists: true });
  pgm.dropTable("platos_categorias", { ifExists: true });
  pgm.dropTable("categorias_plato", { ifExists: true });
  pgm.dropTable("alias_platos", { ifExists: true });
  pgm.dropTable("componentes_plato", { ifExists: true });
  pgm.dropTable("platos", { ifExists: true });
};
