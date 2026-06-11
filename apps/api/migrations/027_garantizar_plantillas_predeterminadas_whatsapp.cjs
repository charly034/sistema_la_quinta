exports.up = (pgm) => {
  pgm.sql(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_plantillas_predeterminada_activa_contexto
    ON plantillas_mensaje_menu (
      tipo,
      COALESCE(marca_id, '00000000-0000-0000-0000-000000000001'::uuid),
      COALESCE(canal_id, '00000000-0000-0000-0000-000000000002'::uuid),
      COALESCE(empresa_id, '00000000-0000-0000-0000-000000000003'::uuid)
    )
    WHERE es_predeterminada = true
      AND estado = 'ACTIVA'
      AND eliminado_en IS NULL;
  `);

  pgm.sql(`
    WITH creador AS (
      SELECT id FROM usuarios ORDER BY creado_en ASC LIMIT 1
    ), marca_lq AS (
      SELECT id FROM marcas WHERE codigo = 'LA_QUINTA' LIMIT 1
    )
    INSERT INTO plantillas_mensaje_menu (
      id,
      marca_id,
      canal_id,
      empresa_id,
      nombre,
      tipo,
      plantilla,
      configuracion,
      estado,
      es_predeterminada,
      creado_por,
      creado_en,
      actualizado_en
    )
    SELECT
      '550e8400-e29b-41d4-a716-446655440106'::uuid,
      m.id,
      NULL,
      NULL,
      'Plantilla predeterminada WhatsApp La Quinta',
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
      c.id,
      NOW(),
      NOW()
    FROM marca_lq m
    CROSS JOIN creador c
    WHERE NOT EXISTS (
      SELECT 1
      FROM plantillas_mensaje_menu p
      WHERE p.tipo = 'WHATSAPP'
        AND p.estado = 'ACTIVA'
        AND p.es_predeterminada = true
        AND p.eliminado_en IS NULL
        AND p.marca_id = m.id
        AND p.canal_id IS NULL
        AND p.empresa_id IS NULL
    );
  `);

  pgm.sql(`
    WITH creador AS (
      SELECT id FROM usuarios ORDER BY creado_en ASC LIMIT 1
    )
    INSERT INTO plantillas_mensaje_menu (
      id,
      marca_id,
      canal_id,
      empresa_id,
      nombre,
      tipo,
      plantilla,
      configuracion,
      estado,
      es_predeterminada,
      creado_por,
      creado_en,
      actualizado_en
    )
    SELECT
      '550e8400-e29b-41d4-a716-446655440107'::uuid,
      NULL,
      NULL,
      NULL,
      'Plantilla global WhatsApp',
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
      c.id,
      NOW(),
      NOW()
    FROM creador c
    WHERE NOT EXISTS (
      SELECT 1
      FROM plantillas_mensaje_menu p
      WHERE p.tipo = 'WHATSAPP'
        AND p.estado = 'ACTIVA'
        AND p.es_predeterminada = true
        AND p.eliminado_en IS NULL
        AND p.marca_id IS NULL
        AND p.canal_id IS NULL
        AND p.empresa_id IS NULL
    );
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DELETE FROM plantillas_mensaje_menu
    WHERE id IN (
      '550e8400-e29b-41d4-a716-446655440106'::uuid,
      '550e8400-e29b-41d4-a716-446655440107'::uuid
    );
  `);
};
