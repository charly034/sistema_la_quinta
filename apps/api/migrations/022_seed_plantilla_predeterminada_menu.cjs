exports.up = (pgm) => {
  pgm.sql(`
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
      creado_en
    )
    SELECT
      '550e8400-e29b-41d4-a716-446655440101'::uuid,
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
      ORDER BY creado_en ASC
      LIMIT 1
    ) u
    WHERE m.codigo = 'LA_QUINTA'
      AND NOT EXISTS (
        SELECT 1
        FROM plantillas_mensaje_menu p
        WHERE p.marca_id = m.id
          AND p.tipo = 'WHATSAPP'
          AND p.es_predeterminada = true
          AND p.eliminado_en IS NULL
      );
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DELETE FROM plantillas_mensaje_menu
    WHERE id = '550e8400-e29b-41d4-a716-446655440101'::uuid
  `);
};
