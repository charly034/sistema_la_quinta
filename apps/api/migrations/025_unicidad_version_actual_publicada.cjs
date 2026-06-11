exports.up = (pgm) => {
  pgm.sql(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_version_actual_unica_por_semana
    ON versiones_semana_menu (semana_menu_id)
    WHERE es_actual = true;
  `);

  pgm.sql(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_version_publicada_actual_unica_por_semana
    ON versiones_semana_menu (semana_menu_id)
    WHERE es_publicada_actual = true;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_version_actual_unica_por_semana;
  `);

  pgm.sql(`
    DROP INDEX IF EXISTS idx_version_publicada_actual_unica_por_semana;
  `);
};
