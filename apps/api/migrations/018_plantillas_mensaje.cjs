exports.up = (pgm) => {
  // Crear tabla plantillas_mensaje_menu
  pgm.createTable("plantillas_mensaje_menu", {
    id: { type: "uuid", primaryKey: true },
    marca_id: {
      type: "uuid",
      notNull: false,
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
    nombre: { type: "text", notNull: true },
    tipo: { type: "text", notNull: true, default: "WHATSAPP" },
    plantilla: { type: "text", notNull: true },
    configuracion: { type: "jsonb", notNull: true, default: "{}" },
    estado: { type: "text", notNull: true, default: "ACTIVA" },
    es_predeterminada: { type: "boolean", notNull: true, default: false },
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

  // Restricción: tipo válido
  pgm.sql(`
    ALTER TABLE plantillas_mensaje_menu ADD CONSTRAINT plantillas_mensaje_menu_tipo_valido CHECK (
      tipo IN ('WHATSAPP')
    )
  `);

  // Restricción: estado válido
  pgm.sql(`
    ALTER TABLE plantillas_mensaje_menu ADD CONSTRAINT plantillas_mensaje_menu_estado_valido CHECK (
      estado IN ('ACTIVA', 'INACTIVA', 'ARCHIVADA')
    )
  `);

  // Índices
  pgm.createIndex("plantillas_mensaje_menu", "marca_id");
  pgm.createIndex("plantillas_mensaje_menu", "canal_id");
  pgm.createIndex("plantillas_mensaje_menu", "empresa_id");
  pgm.createIndex("plantillas_mensaje_menu", "tipo");
  pgm.createIndex("plantillas_mensaje_menu", "es_predeterminada");
  pgm.createIndex("plantillas_mensaje_menu", "estado");
};

exports.down = (pgm) => {
  pgm.dropTable("plantillas_mensaje_menu", { ifExists: true });
};
