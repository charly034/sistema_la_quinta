exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE importaciones_menu
    DROP CONSTRAINT IF EXISTS importaciones_menu_hash_unico;
  `);

  pgm.sql(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_importaciones_menu_hash_real_activa_unica
    ON importaciones_menu (hash_archivo)
    WHERE modo_simulacion = false
      AND estado IN ('INICIADA', 'VALIDADA', 'COMPLETADA');
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_importaciones_menu_hash_real_activa_unica;
  `);

  pgm.sql(`
    ALTER TABLE importaciones_menu
    ADD CONSTRAINT importaciones_menu_hash_unico UNIQUE (hash_archivo);
  `);
};
