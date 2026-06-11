exports.up = (pgm) => {
  // Crear tabla importaciones_menu
  pgm.createTable("importaciones_menu", {
    id: { type: "uuid", primaryKey: true },
    nombre_archivo: { type: "text", notNull: true },
    hash_archivo: { type: "text", notNull: true },
    modo_simulacion: { type: "boolean", notNull: true, default: false },
    estado: { type: "text", notNull: true, default: "INICIADA" },
    estrategia_conflicto: { type: "text", notNull: true, default: "ERROR" },
    resumen: { type: "jsonb", notNull: true, default: "{}" },
    advertencias: { type: "jsonb", notNull: true, default: "[]" },
    errores: { type: "jsonb", notNull: true, default: "[]" },
    ejecutado_por: { type: "uuid", notNull: true, references: "usuarios" },
    iniciado_en: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    finalizado_en: { type: "timestamptz", notNull: false },
  });

  // Restricción: estado válido
  pgm.sql(`
    ALTER TABLE importaciones_menu ADD CONSTRAINT importaciones_menu_estado_valido CHECK (
      estado IN ('INICIADA', 'VALIDADA', 'COMPLETADA', 'FALLIDA', 'SIMULADA')
    )
  `);

  // Restricción: estrategia válida
  pgm.sql(`
    ALTER TABLE importaciones_menu ADD CONSTRAINT importaciones_menu_estrategia_valida CHECK (
      estrategia_conflicto IN ('ERROR', 'OMITIR', 'CREAR_VERSION')
    )
  `);

  // Restricción: hash único (evitar importaciones duplicadas)
  pgm.addConstraint("importaciones_menu", "importaciones_menu_hash_unico", {
    unique: ["hash_archivo"],
  });

  // Índices
  pgm.createIndex("importaciones_menu", "estado");
  pgm.createIndex("importaciones_menu", "iniciado_en");
  pgm.createIndex("importaciones_menu", "ejecutado_por");
};

exports.down = (pgm) => {
  pgm.dropTable("importaciones_menu", { ifExists: true });
};
