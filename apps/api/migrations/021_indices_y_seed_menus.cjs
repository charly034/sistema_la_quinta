exports.up = (pgm) => {
  // Crear índice funcional para unicidad de contexto de semana (marca + canal + empresa + fecha_inicio)
  pgm.sql(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_semanas_menu_contexto
    ON semanas_menu(marca_id, COALESCE(canal_id, '00000000-0000-0000-0000-000000000001'::uuid), COALESCE(empresa_id, '00000000-0000-0000-0000-000000000002'::uuid), fecha_inicio)
    WHERE eliminado_en IS NULL
  `);

  // Nota: Índices para es_actual, es_publicada_actual ya se crean en migración 016
  // Solo crear índices adicionales no creados en 016

  // Índice para búsqueda de versión por origen
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS "versiones_semana_menu_origen_version_id_index" ON "versiones_semana_menu" ("origen_version_id")
  `);

  // Índice para búsqueda de opciones por plato
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_opciones_dia_menu_plato_version
    ON opciones_dia_menu(plato_id, dia_version_menu_id)
  `);

  // Insertar plantilla predeterminada para La Quinta (WHATSAPP)
  pgm.sql(`
    INSERT INTO plantillas_mensaje_menu
    (id, marca_id, canal_id, empresa_id, nombre, tipo, plantilla, configuracion, estado, es_predeterminada, creado_por, creado_en)
    SELECT
      '550e8400-e29b-41d4-a716-446655440100',
      m.id,
      NULL,
      NULL,
      'Plantilla predeterminada WhatsApp',
      'WHATSAPP',
      E'🗓️ SEMANA {{rango_semana}}\n\n{{contenido_dias}}',
      jsonb_build_object(
        'usar_rango_operativo', true,
        'incluir_feriados', true,
        'incluir_cerrados', false,
        'incluir_sin_configurar', false,
        'incluir_fin_de_semana', false,
        'mostrar_fecha_en_feriados', false
      ),
      'ACTIVA',
      true,
      u.id,
      NOW()
    FROM marcas m
    CROSS JOIN LATERAL (
      SELECT id
      FROM usuarios
      LIMIT 1
    ) u
    WHERE m.codigo = 'LA_QUINTA'
    ON CONFLICT DO NOTHING;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DELETE FROM plantillas_mensaje_menu
    WHERE id = '550e8400-e29b-41d4-a716-446655440100'
  `);

  pgm.sql(`
    DROP INDEX IF EXISTS idx_opciones_dia_menu_plato_version
  `);

  pgm.sql(`
    DROP INDEX IF EXISTS "versiones_semana_menu_origen_version_id_index"
  `);

  pgm.sql(`
    DROP INDEX IF EXISTS idx_semanas_menu_contexto
  `);
};
