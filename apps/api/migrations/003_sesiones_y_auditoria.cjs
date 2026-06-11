exports.up = (pgm) => {
  pgm.createTable("sesiones_refresco", {
    id: { type: "uuid", primaryKey: true },
    usuario_id: {
      type: "uuid",
      notNull: true,
      references: "usuarios",
      onDelete: "RESTRICT",
    },
    hash_token: { type: "text", notNull: true },
    familia_token: { type: "uuid", notNull: true },
    creado_en: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    expira_en: { type: "timestamptz", notNull: true },
    revocado_en: { type: "timestamptz", notNull: false },
    reemplazado_por_id: { type: "uuid", notNull: false },
    direccion_ip: { type: "text", notNull: false },
    agente_usuario: { type: "text", notNull: false },
  });
  pgm.createIndex("sesiones_refresco", "usuario_id");
  pgm.createIndex("sesiones_refresco", "hash_token");
  pgm.createIndex("sesiones_refresco", "expira_en");
  pgm.addConstraint("sesiones_refresco", "sesiones_refresco_hash_token_unico", {
    unique: ["hash_token"],
  });

  pgm.createTable("auditoria", {
    id: { type: "uuid", primaryKey: true },
    usuario_id: {
      type: "uuid",
      notNull: false,
      references: "usuarios",
      onDelete: "RESTRICT",
    },
    accion: { type: "text", notNull: true },
    entidad: { type: "text", notNull: true },
    entidad_id: { type: "text", notNull: false },
    datos_anteriores: { type: "jsonb", notNull: false },
    datos_posteriores: { type: "jsonb", notNull: false },
    direccion_ip: { type: "text", notNull: false },
    agente_usuario: { type: "text", notNull: false },
    motivo: { type: "text", notNull: false },
    creado_en: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.createIndex("auditoria", "usuario_id");
  pgm.createIndex("auditoria", "accion");
  pgm.createIndex("auditoria", "entidad");
  pgm.createIndex("auditoria", "entidad_id");
  pgm.createIndex("auditoria", "creado_en");
};

exports.down = (pgm) => {
  pgm.dropTable("auditoria", { ifExists: true });
  pgm.dropTable("sesiones_refresco", { ifExists: true });
};
