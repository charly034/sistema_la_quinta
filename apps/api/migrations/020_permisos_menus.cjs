exports.up = (pgm) => {
  // Insertar permisos de menús semanales
  pgm.sql(`
    INSERT INTO permisos (id, codigo, nombre, descripcion, creado_en)
    VALUES
      ('550e8400-e29b-41d4-a716-446655440001', 'MENUS_LEER', 'Leer menús semanales', 'Permite consultar menús semanales', NOW()),
      ('550e8400-e29b-41d4-a716-446655440002', 'MENUS_GESTIONAR', 'Gestionar menús semanales', 'Permite crear, editar y duplicar menús semanales', NOW()),
      ('550e8400-e29b-41d4-a716-446655440003', 'MENUS_APROBAR', 'Aprobar menús semanales', 'Permite aprobar menús semanales', NOW()),
      ('550e8400-e29b-41d4-a716-446655440004', 'MENUS_PUBLICAR', 'Publicar menús semanales', 'Permite publicar y finalizar menús semanales', NOW()),
      ('550e8400-e29b-41d4-a716-446655440005', 'MENUS_EXPORTAR', 'Exportar menús semanales', 'Permite exportar menús semanales a Excel y texto', NOW()),
      ('550e8400-e29b-41d4-a716-446655440006', 'MENUS_IMPORTAR', 'Importar menús semanales', 'Permite importar menús históricos desde JSON', NOW())
    ON CONFLICT (codigo) DO NOTHING;
  `);

  // Asignar permisos a PROPIETARIO (todos)
  pgm.sql(`
    INSERT INTO roles_permisos (rol_id, permiso_id, creado_en)
    SELECT r.id, p.id, NOW()
    FROM roles r, permisos p
    WHERE r.codigo = 'PROPIETARIO'
    AND p.codigo IN ('MENUS_LEER', 'MENUS_GESTIONAR', 'MENUS_APROBAR', 'MENUS_PUBLICAR', 'MENUS_EXPORTAR', 'MENUS_IMPORTAR')
    ON CONFLICT DO NOTHING;
  `);

  // Asignar permisos a ADMINISTRADOR (leer, gestionar, aprobar, publicar, exportar)
  pgm.sql(`
    INSERT INTO roles_permisos (rol_id, permiso_id, creado_en)
    SELECT r.id, p.id, NOW()
    FROM roles r, permisos p
    WHERE r.codigo = 'ADMINISTRADOR'
    AND p.codigo IN ('MENUS_LEER', 'MENUS_GESTIONAR', 'MENUS_APROBAR', 'MENUS_PUBLICAR', 'MENUS_EXPORTAR')
    ON CONFLICT DO NOTHING;
  `);

  // Asignar permisos a EDITOR (leer, gestionar, exportar)
  pgm.sql(`
    INSERT INTO roles_permisos (rol_id, permiso_id, creado_en)
    SELECT r.id, p.id, NOW()
    FROM roles r, permisos p
    WHERE r.codigo = 'EDITOR'
    AND p.codigo IN ('MENUS_LEER', 'MENUS_GESTIONAR', 'MENUS_EXPORTAR')
    ON CONFLICT DO NOTHING;
  `);

  // Asignar permisos a LECTOR (solo leer y exportar)
  pgm.sql(`
    INSERT INTO roles_permisos (rol_id, permiso_id, creado_en)
    SELECT r.id, p.id, NOW()
    FROM roles r, permisos p
    WHERE r.codigo = 'LECTOR'
    AND p.codigo IN ('MENUS_LEER', 'MENUS_EXPORTAR')
    ON CONFLICT DO NOTHING;
  `);

  // CLIENTE no recibe permisos de menús por defecto
};

exports.down = (pgm) => {
  // Remover asignaciones de permisos-roles
  pgm.sql(`
    DELETE FROM roles_permisos
    WHERE permiso_id IN (
      SELECT id FROM permisos WHERE codigo IN ('MENUS_LEER', 'MENUS_GESTIONAR', 'MENUS_APROBAR', 'MENUS_PUBLICAR', 'MENUS_EXPORTAR', 'MENUS_IMPORTAR')
    );
  `);

  // Remover permisos
  pgm.sql(`
    DELETE FROM permisos
    WHERE codigo IN ('MENUS_LEER', 'MENUS_GESTIONAR', 'MENUS_APROBAR', 'MENUS_PUBLICAR', 'MENUS_EXPORTAR', 'MENUS_IMPORTAR');
  `);
};
