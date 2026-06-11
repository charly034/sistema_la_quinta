import { randomUUID } from "node:crypto";

export async function obtenerSemana(db, semanaId) {
  const q = await db.query(
    "SELECT * FROM semanas_menu WHERE id = $1 AND eliminado_en IS NULL",
    [semanaId],
  );
  return q.rows[0] || null;
}

export async function obtenerVersion(db, versionId) {
  const q = await db.query(
    "SELECT * FROM versiones_semana_menu WHERE id = $1",
    [versionId],
  );
  return q.rows[0] || null;
}

export async function obtenerDiasConOpcionesVersion(db, versionId) {
  const q = await db.query(
    `SELECT d.id AS dia_id, d.fecha, d.nombre_dia, d.numero_dia_iso, d.estado_dia,
            o.id AS opcion_id, o.opcion_menu_marca_id, o.codigo_opcion, o.nombre_opcion,
            o.plato_id, o.bloqueado_manual, o.orden
     FROM dias_version_menu d
     LEFT JOIN opciones_dia_menu o ON o.dia_version_menu_id = d.id
     WHERE d.version_semana_id = $1
     ORDER BY d.orden ASC, o.orden ASC, o.creado_en ASC`,
    [versionId],
  );
  return q.rows;
}

export async function obtenerOpcionesMarcaActivas(db, marcaId) {
  const q = await db.query(
    `SELECT id, codigo, nombre, orden
     FROM opciones_menu_marca
     WHERE marca_id = $1 AND estado = 'ACTIVA' AND eliminado_en IS NULL
     ORDER BY orden ASC, codigo ASC`,
    [marcaId],
  );
  return q.rows;
}

export async function crearOpcionesFaltantesDia(db, diaId, opcionesMarca) {
  for (const opcion of opcionesMarca) {
    const existe = await db.query(
      `SELECT id FROM opciones_dia_menu WHERE dia_version_menu_id = $1 AND opcion_menu_marca_id = $2 LIMIT 1`,
      [diaId, opcion.id],
    );
    if (!existe.rows[0]) {
      await db.query(
        `INSERT INTO opciones_dia_menu (
          id, dia_version_menu_id, opcion_menu_marca_id, plato_id,
          codigo_opcion, nombre_opcion, orden, bloqueado_manual, creado_en, actualizado_en
        ) VALUES ($1,$2,$3,NULL,$4,$5,$6,false,NOW(),NOW())`,
        [
          randomUUID(),
          diaId,
          opcion.id,
          opcion.codigo,
          opcion.nombre,
          opcion.orden || 0,
        ],
      );
    }
  }
}

export async function obtenerPlatosCandidatos(db, marcaId) {
  const q = await db.query(
    `SELECT
      p.id,
      p.nombre,
      p.tipo,
      p.estado,
      p.favorito,
      p.es_estacional,
      p.temporada_desde,
      p.temporada_hasta,
      p.bloqueado_desde,
      p.bloqueado_hasta,
      COALESCE((SELECT json_agg(pc.categoria_id) FROM platos_categorias pc WHERE pc.plato_id = p.id), '[]'::json) AS categorias,
      COALESCE((SELECT json_agg(pp.proteina_id) FROM platos_proteinas pp WHERE pp.plato_id = p.id), '[]'::json) AS proteinas
     FROM platos p
     WHERE p.marca_id = $1
       AND p.eliminado_en IS NULL
     ORDER BY p.id ASC`,
    [marcaId],
  );
  return q.rows;
}

export async function obtenerMetricasHistoricasPlato(
  db,
  platoId,
  marcaId,
  fechaActual,
) {
  const fechaIso = fechaActual
    ? new Date(fechaActual).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  const q = await db.query(
    `SELECT
      MAX(d.fecha) AS ultima_fecha,
      COUNT(*)::int AS usos_totales,
      COUNT(*) FILTER (WHERE d.numero_dia_iso = EXTRACT(ISODOW FROM $3::date))::int AS usos_mismo_dia
     FROM opciones_dia_menu o
     JOIN dias_version_menu d ON d.id = o.dia_version_menu_id
     JOIN versiones_semana_menu v ON v.id = d.version_semana_id
     JOIN semanas_menu s ON s.id = v.semana_menu_id
     WHERE o.plato_id = $1
       AND s.marca_id = $2
       AND d.fecha < $3::date
       AND v.estado IN ('PUBLICADO','FINALIZADO')`,
    [platoId, marcaId, fechaIso],
  );
  return (
    q.rows[0] || { ultima_fecha: null, usos_totales: 0, usos_mismo_dia: 0 }
  );
}

export async function obtenerReglasActivasPorContexto(
  db,
  { marcaId, canalId, empresaId, fecha },
) {
  const q = await db.query(
    `SELECT *
     FROM reglas_menu
     WHERE eliminado_en IS NULL
       AND estado = 'ACTIVA'
       AND (vigencia_desde IS NULL OR vigencia_desde <= $4)
       AND (vigencia_hasta IS NULL OR vigencia_hasta >= $4)
       AND (marca_id IS NULL OR marca_id = $1)
       AND (canal_id IS NULL OR canal_id = $2)
       AND (empresa_id IS NULL OR empresa_id = $3)
     ORDER BY prioridad DESC, actualizado_en DESC`,
    [marcaId || null, canalId || null, empresaId || null, fecha],
  );
  return q.rows;
}

export async function obtenerPerfilPorCodigo(db, codigo, contexto = {}) {
  const q = await db.query(
    `SELECT * FROM perfiles_reglas
     WHERE codigo = $1
       AND estado = 'ACTIVO'
       AND eliminado_en IS NULL
       AND (marca_id IS NULL OR marca_id = $2)
       AND (canal_id IS NULL OR canal_id = $3)
       AND (empresa_id IS NULL OR empresa_id = $4)
     ORDER BY
       (empresa_id IS NOT NULL)::int DESC,
       (canal_id IS NOT NULL)::int DESC,
       (marca_id IS NOT NULL)::int DESC,
       es_predeterminado DESC,
       actualizado_en DESC
     LIMIT 1`,
    [
      codigo,
      contexto.marcaId || null,
      contexto.canalId || null,
      contexto.empresaId || null,
    ],
  );
  return q.rows[0] || null;
}

export async function obtenerPerfilPorId(db, perfilId) {
  const q = await db.query(
    "SELECT * FROM perfiles_reglas WHERE id = $1 AND eliminado_en IS NULL",
    [perfilId],
  );
  return q.rows[0] || null;
}

export async function obtenerDetallePerfil(db, perfilId) {
  const q = await db.query(
    `SELECT d.*, r.codigo AS regla_codigo, r.tipo AS regla_tipo, r.naturaleza AS regla_naturaleza,
            r.parametros AS regla_parametros, r.peso AS regla_peso, r.prioridad AS regla_prioridad,
            r.estado AS regla_estado
     FROM perfiles_reglas_detalle d
     JOIN reglas_menu r ON r.id = d.regla_id
     WHERE d.perfil_id = $1
     ORDER BY d.orden ASC, r.prioridad DESC`,
    [perfilId],
  );
  return q.rows;
}

export async function crearPropuesta(db, datos) {
  const id = randomUUID();
  const q = await db.query(
    `INSERT INTO propuestas_menu (
      id, semana_menu_id, version_semana_id, perfil_reglas_id, tipo, estado,
      puntaje_total, semilla, parametros_generacion, resumen, reglas_incumplidas,
      version_actualizada_en, version_huella, creado_por, creado_en, actualizado_en
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11::jsonb,$12,$13,$14,NOW(),NOW()
    ) RETURNING *`,
    [
      id,
      datos.semanaMenuId,
      datos.versionSemanaId,
      datos.perfilReglasId || null,
      datos.tipo,
      datos.estado,
      datos.puntajeTotal,
      datos.semilla,
      JSON.stringify(datos.parametrosGeneracion || {}),
      JSON.stringify(datos.resumen || {}),
      JSON.stringify(datos.reglasIncumplidas || []),
      datos.versionActualizadaEn || null,
      datos.versionHuella || null,
      datos.creadoPor,
    ],
  );
  return q.rows[0];
}

export async function insertarDetallePropuesta(db, propuestaId, filas) {
  for (const fila of filas) {
    const fechaIso = fila.fecha
      ? new Date(fila.fecha).toISOString().slice(0, 10)
      : null;
    await db.query(
      `INSERT INTO propuestas_menu_detalle (
        id, propuesta_id, dia_version_menu_id, fecha, opcion_menu_marca_id,
        codigo_opcion, nombre_opcion, plato_id, puntaje, posicion_bloqueada,
        seleccionado_manual, explicacion, metricas, orden, creado_en
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb,$14,NOW())`,
      [
        randomUUID(),
        propuestaId,
        fila.diaVersionMenuId,
        fechaIso,
        fila.opcionMenuMarcaId,
        fila.codigoOpcion,
        fila.nombreOpcion,
        fila.platoId || null,
        fila.puntaje || 0,
        !!fila.posicionBloqueada,
        !!fila.seleccionadoManual,
        JSON.stringify(fila.explicacion || {}),
        JSON.stringify(fila.metricas || {}),
        fila.orden || 0,
      ],
    );
  }
}

export async function listarPropuestas(db, semanaId, versionId, filtros = {}) {
  const params = [semanaId, versionId];
  let i = 3;
  let sql =
    "SELECT * FROM propuestas_menu WHERE semana_menu_id = $1 AND version_semana_id = $2";

  if (filtros.estado) {
    sql += ` AND estado = $${i}`;
    params.push(filtros.estado);
    i += 1;
  }
  if (filtros.perfil_id) {
    sql += ` AND perfil_reglas_id = $${i}`;
    params.push(filtros.perfil_id);
    i += 1;
  }
  if (filtros.tipo) {
    sql += ` AND tipo = $${i}`;
    params.push(filtros.tipo);
    i += 1;
  }
  if (filtros.creado_desde) {
    sql += ` AND creado_en >= $${i}`;
    params.push(filtros.creado_desde);
    i += 1;
  }
  if (filtros.creado_hasta) {
    sql += ` AND creado_en <= $${i}`;
    params.push(filtros.creado_hasta);
    i += 1;
  }

  sql += " ORDER BY creado_en DESC";
  const q = await db.query(sql, params);
  return q.rows;
}

export async function obtenerPropuesta(db, propuestaId, semanaId, versionId) {
  const q = await db.query(
    `SELECT * FROM propuestas_menu
     WHERE id = $1 AND semana_menu_id = $2 AND version_semana_id = $3`,
    [propuestaId, semanaId, versionId],
  );
  return q.rows[0] || null;
}

export async function obtenerDetallePropuesta(db, propuestaId) {
  const q = await db.query(
    `SELECT d.*, p.nombre AS plato_nombre
     FROM propuestas_menu_detalle d
     LEFT JOIN platos p ON p.id = d.plato_id
     WHERE d.propuesta_id = $1
     ORDER BY d.fecha ASC, d.orden ASC`,
    [propuestaId],
  );
  return q.rows;
}

export async function actualizarEstadoPropuesta(
  db,
  propuestaId,
  estado,
  usuarioId,
  extras = {},
) {
  const q = await db.query(
    `UPDATE propuestas_menu
     SET estado = $1,
         aprobado_por = COALESCE($2, aprobado_por),
         aprobado_en = COALESCE($3, aprobado_en),
         descartado_en = COALESCE($4, descartado_en),
         motivo_descarte = COALESCE($5, motivo_descarte),
         actualizado_en = NOW()
     WHERE id = $6
     RETURNING *`,
    [
      estado,
      extras.aprobadoPor || null,
      extras.aprobadoEn || null,
      extras.descartadoEn || null,
      extras.motivoDescarte || null,
      propuestaId,
    ],
  );
  return q.rows[0] || null;
}

export async function aplicarDetallePropuesta(
  db,
  propuestaId,
  permitirBloqueadas = false,
  opciones = {},
) {
  const detalle = await obtenerDetallePropuesta(db, propuestaId);
  let aplicadas = 0;
  for (const item of detalle) {
    if (item.posicion_bloqueada && !permitirBloqueadas) continue;
    await db.query(
      `UPDATE opciones_dia_menu
       SET plato_id = $1, actualizado_en = NOW()
       WHERE dia_version_menu_id = $2 AND opcion_menu_marca_id = $3 AND bloqueado_manual = false`,
      [item.plato_id, item.dia_version_menu_id, item.opcion_menu_marca_id],
    );
    aplicadas += 1;

    const failAfter = Number(opciones.failAfterUpdates || 0);
    if (failAfter > 0 && aplicadas >= failAfter) {
      const error = new Error("FALLO_CONTROLADO_APLICAR_PROPUESTA");
      error.code = "FALLO_CONTROLADO_APLICAR_PROPUESTA";
      throw error;
    }
  }
  return aplicadas;
}

export async function registrarAuditoria(db, datos) {
  await db.query(
    `INSERT INTO auditoria (
      id, usuario_id, accion, entidad, entidad_id, datos_anteriores, datos_posteriores, motivo, creado_en
    ) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,NOW())`,
    [
      randomUUID(),
      datos.usuarioId,
      datos.accion,
      datos.entidad,
      datos.entidadId,
      JSON.stringify(datos.datosAnteriores || null),
      JSON.stringify(datos.datosPosteriores || null),
      datos.motivo || null,
    ],
  );
}
