exports.up = (pgm) => {
  pgm.createTable(
    "pedidos",
    {
      id: { type: "text", primaryKey: true },
      fecha: { type: "date", notNull: true },
      hora: { type: "time", notNull: true },
      telefono: { type: "text", notNull: true },
      nombre: { type: "text", notNull: true },
      direccion: { type: "text", notNull: false },
      modalidad: { type: "text", notNull: true },
      productos: { type: "text", notNull: true },
      estado: { type: "text", notNull: false },
    },
    { ifNotExists: true },
  );
};

exports.down = (pgm) => {
  pgm.sql(
    "DO $$ BEGIN RAISE EXCEPTION '001_base_pedidos es forward-only y no permite rollback destructivo de pedidos'; END $$;",
  );
};
