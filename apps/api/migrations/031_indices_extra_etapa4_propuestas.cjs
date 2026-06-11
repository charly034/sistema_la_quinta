exports.up = (pgm) => {
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_reglas_menu_contexto_activo
      ON reglas_menu (marca_id, canal_id, empresa_id, dia_semana_iso)
      WHERE estado = 'ACTIVA' AND eliminado_en IS NULL;

    CREATE INDEX IF NOT EXISTS idx_perfiles_reglas_contexto_activo
      ON perfiles_reglas (marca_id, canal_id, empresa_id, es_predeterminado)
      WHERE estado = 'ACTIVO' AND eliminado_en IS NULL;

    CREATE INDEX IF NOT EXISTS idx_perfiles_detalle_perfil_orden
      ON perfiles_reglas_detalle (perfil_id, activa, orden);

    CREATE INDEX IF NOT EXISTS idx_propuestas_version_estado
      ON propuestas_menu (version_semana_id, estado, creado_en DESC);

    CREATE INDEX IF NOT EXISTS idx_propuestas_detalle_propuesta_orden
      ON propuestas_menu_detalle (propuesta_id, orden, fecha);

    CREATE INDEX IF NOT EXISTS idx_propuestas_detalle_dia_opcion
      ON propuestas_menu_detalle (dia_version_menu_id, opcion_menu_marca_id);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_reglas_menu_contexto_activo;
    DROP INDEX IF EXISTS idx_perfiles_reglas_contexto_activo;
    DROP INDEX IF EXISTS idx_perfiles_detalle_perfil_orden;
    DROP INDEX IF EXISTS idx_propuestas_version_estado;
    DROP INDEX IF EXISTS idx_propuestas_detalle_propuesta_orden;
    DROP INDEX IF EXISTS idx_propuestas_detalle_dia_opcion;
  `);
};
