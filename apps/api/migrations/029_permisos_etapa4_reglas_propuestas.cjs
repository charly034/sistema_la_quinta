exports.up = (pgm) => {
  pgm.sql(`
    INSERT INTO permisos (id, codigo, nombre, descripcion, creado_en)
    VALUES
      ('550e8400-e29b-41d4-a716-446655440201', 'REGLAS_LEER', 'Leer reglas de menús', 'Permite consultar reglas y perfiles de reglas', NOW()),
      ('550e8400-e29b-41d4-a716-446655440202', 'REGLAS_GESTIONAR', 'Gestionar reglas de menús', 'Permite crear, editar, archivar y duplicar reglas y perfiles', NOW()),
      ('550e8400-e29b-41d4-a716-446655440203', 'PROPUESTAS_LEER', 'Leer propuestas de menú', 'Permite consultar propuestas y su detalle', NOW()),
      ('550e8400-e29b-41d4-a716-446655440204', 'PROPUESTAS_GENERAR', 'Generar propuestas de menú', 'Permite generar propuestas automáticas de menú', NOW()),
      ('550e8400-e29b-41d4-a716-446655440205', 'PROPUESTAS_APROBAR', 'Aprobar propuestas de menú', 'Permite aprobar propuestas generadas', NOW()),
      ('550e8400-e29b-41d4-a716-446655440206', 'PROPUESTAS_APLICAR', 'Aplicar propuestas de menú', 'Permite aplicar propuestas sobre versiones editables', NOW())
    ON CONFLICT (codigo) DO NOTHING;
  `);

  pgm.sql(`
    INSERT INTO roles_permisos (rol_id, permiso_id, creado_en)
    SELECT r.id, p.id, NOW()
    FROM roles r
    JOIN permisos p ON p.codigo IN ('REGLAS_LEER','REGLAS_GESTIONAR','PROPUESTAS_LEER','PROPUESTAS_GENERAR','PROPUESTAS_APROBAR','PROPUESTAS_APLICAR')
    WHERE r.codigo IN ('PROPIETARIO','ADMINISTRADOR')
    ON CONFLICT DO NOTHING;
  `);

  pgm.sql(`
    INSERT INTO roles_permisos (rol_id, permiso_id, creado_en)
    SELECT r.id, p.id, NOW()
    FROM roles r
    JOIN permisos p ON p.codigo IN ('REGLAS_LEER','PROPUESTAS_LEER','PROPUESTAS_GENERAR','PROPUESTAS_APLICAR')
    WHERE r.codigo = 'EDITOR'
    ON CONFLICT DO NOTHING;
  `);

  pgm.sql(`
    INSERT INTO roles_permisos (rol_id, permiso_id, creado_en)
    SELECT r.id, p.id, NOW()
    FROM roles r
    JOIN permisos p ON p.codigo IN ('REGLAS_LEER','PROPUESTAS_LEER')
    WHERE r.codigo = 'LECTOR'
    ON CONFLICT DO NOTHING;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DELETE FROM roles_permisos
    WHERE permiso_id IN (
      SELECT id FROM permisos
      WHERE codigo IN ('REGLAS_LEER','REGLAS_GESTIONAR','PROPUESTAS_LEER','PROPUESTAS_GENERAR','PROPUESTAS_APROBAR','PROPUESTAS_APLICAR')
    );
  `);

  pgm.sql(`
    DELETE FROM permisos
    WHERE codigo IN ('REGLAS_LEER','REGLAS_GESTIONAR','PROPUESTAS_LEER','PROPUESTAS_GENERAR','PROPUESTAS_APROBAR','PROPUESTAS_APLICAR');
  `);
};
