const TIPOS_REGLA = {
  NO_REPETIR_PLATO_EN_SEMANA: {
    naturaleza: "OBLIGATORIA",
    prioridad: 10,
    peso: 0,
    parametros: {},
  },
  ANTIGUEDAD_MINIMA_PLATO: {
    naturaleza: "OBLIGATORIA",
    prioridad: 9,
    peso: 0,
    parametros: { semanas_minimas: 2 },
  },
  MAXIMO_CATEGORIA_SEMANA: {
    naturaleza: "PREFERENCIAL",
    prioridad: 6,
    peso: -10,
    parametros: { categoria_codigo: "CARNES", cantidad: 2 },
  },
  MINIMO_CATEGORIA_SEMANA: {
    naturaleza: "PREFERENCIAL",
    prioridad: 6,
    peso: 10,
    parametros: { categoria_codigo: "VEGETARIANOS", cantidad: 1 },
  },
  MAXIMO_PROTEINA_SEMANA: {
    naturaleza: "PREFERENCIAL",
    prioridad: 6,
    peso: -8,
    parametros: { proteina_codigo: "CARNE_VACUNA", cantidad: 2 },
  },
  MINIMO_PROTEINA_SEMANA: {
    naturaleza: "PREFERENCIAL",
    prioridad: 6,
    peso: 8,
    parametros: { proteina_codigo: "POLLO", cantidad: 1 },
  },
  EVITAR_CATEGORIA_DIAS_CONSECUTIVOS: {
    naturaleza: "PREFERENCIAL",
    prioridad: 7,
    peso: 8,
    parametros: {},
  },
  EVITAR_PROTEINA_DIAS_CONSECUTIVOS: {
    naturaleza: "PREFERENCIAL",
    prioridad: 7,
    peso: 8,
    parametros: {},
  },
  EVITAR_GUARNICION_DIAS_CONSECUTIVOS: {
    naturaleza: "PREFERENCIAL",
    prioridad: 6,
    peso: 6,
    parametros: {},
  },
  EVITAR_MISMA_CATEGORIA_EN_EL_DIA: {
    naturaleza: "OBLIGATORIA",
    prioridad: 8,
    peso: 0,
    parametros: {},
  },
  EVITAR_MISMA_PROTEINA_EN_EL_DIA: {
    naturaleza: "OBLIGATORIA",
    prioridad: 8,
    peso: 0,
    parametros: {},
  },
  PRIORIZAR_HISTORICO_POR_DIA: {
    naturaleza: "PREFERENCIAL",
    prioridad: 5,
    peso: 9,
    parametros: { factor: 1 },
  },
  PRIORIZAR_PLATOS_MENOS_USADOS: {
    naturaleza: "PREFERENCIAL",
    prioridad: 5,
    peso: 7,
    parametros: { factor: 1 },
  },
  PRIORIZAR_PLATOS_MAS_USADOS: {
    naturaleza: "PREFERENCIAL",
    prioridad: 4,
    peso: 4,
    parametros: { factor: 1 },
  },
  PRIORIZAR_RENOVACION: {
    naturaleza: "PREFERENCIAL",
    prioridad: 5,
    peso: 9,
    parametros: { factor: 1 },
  },
  PRIORIZAR_FAVORITOS: {
    naturaleza: "PREFERENCIAL",
    prioridad: 4,
    peso: 5,
    parametros: { factor: 1 },
  },
  EXCLUIR_PLATOS_INACTIVOS: {
    naturaleza: "OBLIGATORIA",
    prioridad: 10,
    peso: 0,
    parametros: {},
  },
  EXCLUIR_PLATOS_ARCHIVADOS: {
    naturaleza: "OBLIGATORIA",
    prioridad: 10,
    peso: 0,
    parametros: {},
  },
  EXCLUIR_PLATOS_BLOQUEADOS: {
    naturaleza: "OBLIGATORIA",
    prioridad: 10,
    peso: 0,
    parametros: {},
  },
  RESPETAR_TEMPORADA: {
    naturaleza: "PREFERENCIAL",
    prioridad: 7,
    peso: 6,
    parametros: {},
  },
  PREMIAR_VARIEDAD_CATEGORIAS: {
    naturaleza: "PREFERENCIAL",
    prioridad: 5,
    peso: 7,
    parametros: {},
  },
  PREMIAR_VARIEDAD_PROTEINAS: {
    naturaleza: "PREFERENCIAL",
    prioridad: 5,
    peso: 7,
    parametros: {},
  },
  PENALIZAR_REPETICION_COMPONENTE_PRINCIPAL: {
    naturaleza: "PREFERENCIAL",
    prioridad: 6,
    peso: -6,
    parametros: {},
  },
  PENALIZAR_REPETICION_GUARNICION: {
    naturaleza: "PREFERENCIAL",
    prioridad: 6,
    peso: -6,
    parametros: {},
  },
};

exports.up = (pgm) => {
  pgm.sql(`
    WITH creador AS (
      SELECT id FROM usuarios ORDER BY creado_en ASC LIMIT 1
    )
    INSERT INTO reglas_menu (
      id, codigo, nombre, descripcion, tipo, naturaleza, estado, prioridad, peso,
      parametros, creado_por, actualizado_por, creado_en, actualizado_en
    )
    SELECT
      gen_random_uuid(),
      t.codigo,
      t.codigo,
      'Regla inicial etapa 4: ' || t.codigo,
      t.codigo,
      t.naturaleza,
      'ACTIVA',
      t.prioridad,
      t.peso,
      t.parametros::jsonb,
      c.id,
      c.id,
      NOW(),
      NOW()
    FROM (
      ${Object.entries(TIPOS_REGLA)
        .map(
          ([codigo, cfg]) =>
            `SELECT '${codigo}'::text AS codigo, '${cfg.naturaleza}'::text AS naturaleza, ${cfg.prioridad}::int AS prioridad, ${cfg.peso}::numeric AS peso, '${JSON.stringify(cfg.parametros)}'::text AS parametros`,
        )
        .join(" UNION ALL ")}
    ) t
    CROSS JOIN creador c
    WHERE NOT EXISTS (
      SELECT 1 FROM reglas_menu r WHERE r.codigo = t.codigo AND r.eliminado_en IS NULL
    );
  `);

  pgm.sql(`
    WITH creador AS (
      SELECT id FROM usuarios ORDER BY creado_en ASC LIMIT 1
    )
    INSERT INTO perfiles_reglas (
      id, codigo, nombre, descripcion, estado, es_predeterminado,
      creado_por, actualizado_por, creado_en, actualizado_en
    )
    SELECT gen_random_uuid(), p.codigo, p.nombre, p.descripcion, 'ACTIVO', true,
      c.id, c.id, NOW(), NOW()
    FROM (
      SELECT 'EQUILIBRADO'::text AS codigo, 'Perfil equilibrado'::text AS nombre, 'Favorece variedad y restricciones mínimas'::text AS descripcion
      UNION ALL SELECT 'HISTORICO', 'Perfil histórico', 'Favorece patrones históricos por día con variedad mínima'
      UNION ALL SELECT 'RENOVACION', 'Perfil renovación', 'Favorece platos con mayor antigüedad o menor uso reciente'
    ) p
    CROSS JOIN creador c
    WHERE NOT EXISTS (
      SELECT 1 FROM perfiles_reglas pr WHERE pr.codigo = p.codigo AND pr.eliminado_en IS NULL
    );
  `);

  pgm.sql(`
    INSERT INTO perfiles_reglas_detalle (
      id, perfil_id, regla_id, orden, activa, peso_personalizado, prioridad_personalizada,
      parametros_personalizados, creado_en, actualizado_en
    )
    SELECT
      gen_random_uuid(),
      pr.id,
      r.id,
      ROW_NUMBER() OVER (PARTITION BY pr.id ORDER BY r.prioridad DESC, r.codigo ASC),
      true,
      CASE
        WHEN pr.codigo = 'HISTORICO' AND r.codigo = 'PRIORIZAR_HISTORICO_POR_DIA' THEN 12
        WHEN pr.codigo = 'RENOVACION' AND r.codigo = 'PRIORIZAR_RENOVACION' THEN 12
        WHEN pr.codigo = 'RENOVACION' AND r.codigo = 'PRIORIZAR_PLATOS_MENOS_USADOS' THEN 10
        ELSE NULL
      END,
      NULL,
      NULL,
      NOW(),
      NOW()
    FROM perfiles_reglas pr
    JOIN reglas_menu r ON r.eliminado_en IS NULL
    WHERE pr.codigo IN ('EQUILIBRADO','HISTORICO','RENOVACION')
      AND NOT EXISTS (
        SELECT 1 FROM perfiles_reglas_detalle d WHERE d.perfil_id = pr.id AND d.regla_id = r.id
      );
  `);

  pgm.sql(`
    WITH marca AS (
      SELECT id FROM marcas WHERE codigo = 'LA_QUINTA' LIMIT 1
    )
    UPDATE reglas_menu r
    SET parametros = jsonb_set(r.parametros, '{categoria_id}', to_jsonb(c.id::text), true)
    FROM categorias_plato c
    JOIN marca m ON m.id = c.marca_id
    WHERE r.codigo IN ('MAXIMO_CATEGORIA_SEMANA','MINIMO_CATEGORIA_SEMANA')
      AND c.codigo = (r.parametros->>'categoria_codigo')
      AND r.eliminado_en IS NULL;
  `);

  pgm.sql(`
    WITH marca AS (
      SELECT id FROM marcas WHERE codigo = 'LA_QUINTA' LIMIT 1
    )
    UPDATE reglas_menu r
    SET parametros = jsonb_set(r.parametros, '{proteina_id}', to_jsonb(p.id::text), true)
    FROM proteinas p
    JOIN marca m ON m.id = p.marca_id
    WHERE r.codigo IN ('MAXIMO_PROTEINA_SEMANA','MINIMO_PROTEINA_SEMANA')
      AND p.codigo = (r.parametros->>'proteina_codigo')
      AND r.eliminado_en IS NULL;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DELETE FROM perfiles_reglas_detalle
    WHERE perfil_id IN (
      SELECT id FROM perfiles_reglas WHERE codigo IN ('EQUILIBRADO','HISTORICO','RENOVACION')
    );
  `);

  pgm.sql(`
    DELETE FROM perfiles_reglas WHERE codigo IN ('EQUILIBRADO','HISTORICO','RENOVACION');
  `);

  pgm.sql(`
    DELETE FROM reglas_menu
    WHERE codigo IN (${Object.keys(TIPOS_REGLA)
      .map((k) => `'${k}'`)
      .join(",")});
  `);
};
