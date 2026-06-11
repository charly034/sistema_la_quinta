/**
 * Repositorio SQL para menús semanales
 * Queries parametrizadas sin ORM
 * Spec Etapa 3 - Sección 3: Arquitectura
 */

import { v4 as uuid } from "uuid";
import { formatoFecha } from "./menus-semanales.utilidades.js";

/**
 * SEMANAS MENÚ
 */

/**
 * Crear nueva semana menú
 */
export async function crearSemana(
  db,
  { marcaId, canalId, empresaId, fechaInicio, fechaFin, creadoPorId },
) {
  const id = uuid();
  const resultado = await db.query(
    `INSERT INTO semanas_menu
    (id, marca_id, canal_id, empresa_id, fecha_inicio, fecha_fin, creado_por, creado_en, actualizado_en)
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
    RETURNING *`,
    [
      id,
      marcaId,
      canalId || null,
      empresaId || null,
      fechaInicio,
      fechaFin,
      creadoPorId,
    ],
  );
  return resultado.rows[0];
}

/**
 * Obtener semana por ID
 */
export async function obtenerSemana(db, semanaId) {
  const resultado = await db.query(
    `SELECT * FROM semanas_menu WHERE id = $1 AND eliminado_en IS NULL`,
    [semanaId],
  );
  return resultado.rows[0];
}

/**
 * Listar semanas con filtros
 */
export async function listarSemanas(db, filtros) {
  let query = `SELECT * FROM semanas_menu WHERE eliminado_en IS NULL`;
  const params = [];
  let paramCount = 1;

  if (filtros.marcaId) {
    query += ` AND marca_id = $${paramCount}`;
    params.push(filtros.marcaId);
    paramCount++;
  }

  if (filtros.canalId) {
    query += ` AND canal_id = $${paramCount}`;
    params.push(filtros.canalId);
    paramCount++;
  }

  if (filtros.empresaId) {
    query += ` AND empresa_id = $${paramCount}`;
    params.push(filtros.empresaId);
    paramCount++;
  }

  if (filtros.desde) {
    query += ` AND fecha_inicio >= $${paramCount}`;
    params.push(filtros.desde);
    paramCount++;
  }

  if (filtros.hasta) {
    query += ` AND fecha_fin <= $${paramCount}`;
    params.push(filtros.hasta);
    paramCount++;
  }

  query += ` ORDER BY fecha_inicio DESC`;

  if (filtros.limite) {
    query += ` LIMIT $${paramCount}`;
    params.push(filtros.limite);
    paramCount++;
  }

  if (filtros.offset) {
    query += ` OFFSET $${paramCount}`;
    params.push(filtros.offset);
  }

  const resultado = await db.query(query, params);
  return resultado.rows;
}

/**
 * Actualizar versión actual de semana
 */
export async function actualizarVersionActual(db, semanaId, versionActualId) {
  const resultado = await db.query(
    `UPDATE semanas_menu SET version_actual_id = $1, actualizado_en = NOW() WHERE id = $2 RETURNING *`,
    [versionActualId, semanaId],
  );
  return resultado.rows[0];
}

/**
 * Actualizar versión publicada de semana
 */
export async function actualizarVersionPublicada(
  db,
  semanaId,
  versionPublicadaId,
) {
  const resultado = await db.query(
    `UPDATE semanas_menu SET version_publicada_id = $1, actualizado_en = NOW() WHERE id = $2 RETURNING *`,
    [versionPublicadaId, semanaId],
  );
  return resultado.rows[0];
}

export async function actualizarSemana(
  db,
  semanaId,
  { fechaInicio, fechaFin },
) {
  const resultado = await db.query(
    `UPDATE semanas_menu
     SET fecha_inicio = COALESCE($1, fecha_inicio),
         fecha_fin = COALESCE($2, fecha_fin),
         actualizado_en = NOW()
     WHERE id = $3
     RETURNING *`,
    [fechaInicio || null, fechaFin || null, semanaId],
  );
  return resultado.rows[0];
}

/**
 * Marcar semana como eliminada (soft delete)
 */
export async function eliminarSemana(db, semanaId) {
  const resultado = await db.query(
    `UPDATE semanas_menu SET eliminado_en = NOW(), actualizado_en = NOW() WHERE id = $1 RETURNING *`,
    [semanaId],
  );
  return resultado.rows[0];
}

/**
 * VERSIONES
 */

/**
 * Crear nueva versión
 */
export async function crearVersion(
  db,
  {
    semanaId,
    numeroVersion,
    creadoPorId,
    observaciones,
    motivoCambio,
    origenVersionId,
  },
) {
  const id = uuid();
  const resultado = await db.query(
    `INSERT INTO versiones_semana_menu
    (id, semana_menu_id, numero_version, estado, es_actual, es_publicada_actual,
     origen_version_id, observaciones, motivo_cambio, creado_por, creado_en, actualizado_en)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
    RETURNING *`,
    [
      id,
      semanaId,
      numeroVersion,
      "BORRADOR",
      false,
      false,
      origenVersionId || null,
      observaciones || null,
      motivoCambio || null,
      creadoPorId,
    ],
  );
  return resultado.rows[0];
}

/**
 * Obtener versión por ID
 */
export async function obtenerVersion(db, versionId) {
  const resultado = await db.query(
    `SELECT * FROM versiones_semana_menu WHERE id = $1`,
    [versionId],
  );
  return resultado.rows[0];
}

/**
 * Obtener todas las versiones de una semana
 */
export async function obtenerVersionesPorSemana(db, semanaId) {
  const resultado = await db.query(
    `SELECT * FROM versiones_semana_menu WHERE semana_menu_id = $1 ORDER BY numero_version DESC`,
    [semanaId],
  );
  return resultado.rows;
}

/**
 * Obtener versión actual (es_actual = true)
 */
export async function obtenerVersionActual(db, semanaId) {
  const resultado = await db.query(
    `SELECT * FROM versiones_semana_menu WHERE semana_menu_id = $1 AND es_actual = true LIMIT 1`,
    [semanaId],
  );
  return resultado.rows[0];
}

/**
 * Obtener versión publicada actual (es_publicada_actual = true)
 */
export async function obtenerVersionPublicada(db, semanaId) {
  const resultado = await db.query(
    `SELECT * FROM versiones_semana_menu WHERE semana_menu_id = $1 AND es_publicada_actual = true LIMIT 1`,
    [semanaId],
  );
  return resultado.rows[0];
}

/**
 * Actualizar estado de versión
 */
export async function actualizarEstadoVersion(
  db,
  versionId,
  estado,
  usuarioId,
  aprobadoEn = null,
  publicadoEn = null,
) {
  let query = `UPDATE versiones_semana_menu SET estado = $1, actualizado_en = NOW()`;
  const params = [estado, versionId];
  let paramCount = 3;

  if (estado === "APROBADO" && aprobadoEn) {
    query += `, aprobado_por = $${paramCount}, aprobado_en = NOW()`;
    params.splice(2, 0, usuarioId);
    paramCount++;
  }

  if (estado === "PUBLICADO" && publicadoEn) {
    query += `, publicado_por = $${paramCount}, publicado_en = NOW()`;
    params.splice(2, 0, usuarioId);
    paramCount++;
  }

  if (estado === "FINALIZADO") {
    query += `, finalizado_en = NOW()`;
  }

  if (estado === "CANCELADO") {
    query += `, cancelado_en = NOW()`;
  }

  query += ` WHERE id = $2 RETURNING *`;

  const resultado = await db.query(query, params);
  return resultado.rows[0];
}

/**
 * Marcar versión como actual
 */
export async function marcarVersionActual(db, semanaId, versionId) {
  // Primero, desmarcar la versión anterior como actual
  await db.query(
    `UPDATE versiones_semana_menu SET es_actual = false WHERE semana_menu_id = $1 AND es_actual = true`,
    [semanaId],
  );

  // Luego, marcar la nueva como actual
  const resultado = await db.query(
    `UPDATE versiones_semana_menu SET es_actual = true, actualizado_en = NOW() WHERE id = $1 RETURNING *`,
    [versionId],
  );
  return resultado.rows[0];
}

/**
 * Marcar versión como publicada actual
 */
export async function marcarVersionPublicada(db, semanaId, versionId) {
  // Primero, desmarcar la versión anterior como publicada actual
  await db.query(
    `UPDATE versiones_semana_menu SET es_publicada_actual = false WHERE semana_menu_id = $1 AND es_publicada_actual = true`,
    [semanaId],
  );

  // Luego, marcar la nueva como publicada actual
  const resultado = await db.query(
    `UPDATE versiones_semana_menu SET es_publicada_actual = true, actualizado_en = NOW() WHERE id = $1 RETURNING *`,
    [versionId],
  );
  return resultado.rows[0];
}

/**
 * DÍAS DE VERSIÓN
 */

/**
 * Crear día
 */
export async function crearDia(
  db,
  { versionId, numeroDiaIso, nombreDia, fecha, estado, orden },
) {
  const id = uuid();
  const resultado = await db.query(
    `INSERT INTO dias_version_menu
    (id, version_semana_id, numero_dia_iso, nombre_dia, fecha, estado_dia, orden, creado_en, actualizado_en)
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
    RETURNING *`,
    [id, versionId, numeroDiaIso, nombreDia, fecha, estado, orden],
  );
  return resultado.rows[0];
}

/**
 * Obtener días de una versión
 */
export async function obtenerDiasPorVersion(db, versionId) {
  const resultado = await db.query(
    `SELECT * FROM dias_version_menu WHERE version_semana_id = $1 ORDER BY orden ASC`,
    [versionId],
  );
  return resultado.rows;
}

export async function obtenerDiasLaboralesSinOpciones(db, versionId) {
  const resultado = await db.query(
    `SELECT
       d.id,
       d.nombre_dia,
       d.fecha
     FROM dias_version_menu d
     WHERE d.version_semana_id = $1
       AND d.estado_dia = 'DIA_LABORAL'
       AND NOT EXISTS (
         SELECT 1
         FROM opciones_dia_menu o
         WHERE o.dia_version_menu_id = d.id
       )
     ORDER BY d.orden ASC`,
    [versionId],
  );

  return resultado.rows;
}

/**
 * Actualizar día
 */
export async function actualizarDia(db, diaId, actualizaciones) {
  let query = `UPDATE dias_version_menu SET `;
  const campos = [];
  const params = [];
  let paramCount = 1;

  if (actualizaciones.estado !== undefined) {
    campos.push(`estado_dia = $${paramCount}`);
    params.push(actualizaciones.estado);
    paramCount++;
  }

  if (actualizaciones.textoEstado !== undefined) {
    campos.push(`texto_estado = $${paramCount}`);
    params.push(actualizaciones.textoEstado);
    paramCount++;
  }

  if (actualizaciones.observaciones !== undefined) {
    campos.push(`observaciones = $${paramCount}`);
    params.push(actualizaciones.observaciones);
    paramCount++;
  }

  campos.push(`actualizado_en = NOW()`);

  query += campos.join(", ");
  query += ` WHERE id = $${paramCount} RETURNING *`;
  params.push(diaId);

  const resultado = await db.query(query, params);
  return resultado.rows[0];
}

/**
 * OPCIONES DE DÍA
 */

/**
 * Asignar plato a opción en día
 */
export async function asignarPlato(
  db,
  {
    diaId,
    opcionMenuMarcaId,
    platoId,
    codigoOpcion,
    nombreOpcion,
    orden,
    bloqueadoManual,
    observaciones,
  },
) {
  const id = uuid();
  const resultado = await db.query(
    `INSERT INTO opciones_dia_menu
    (id, dia_version_menu_id, opcion_menu_marca_id, plato_id, codigo_opcion, nombre_opcion, orden, bloqueado_manual, observaciones, creado_en, actualizado_en)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
    RETURNING *`,
    [
      id,
      diaId,
      opcionMenuMarcaId,
      platoId,
      codigoOpcion,
      nombreOpcion,
      orden || 0,
      bloqueadoManual || false,
      observaciones || null,
    ],
  );
  return resultado.rows[0];
}

/**
 * Obtener opciones de un día
 */
export async function obtenerOpcionesPorDia(db, diaId) {
  const resultado = await db.query(
    `SELECT * FROM opciones_dia_menu WHERE dia_version_menu_id = $1 ORDER BY orden ASC, creado_en ASC`,
    [diaId],
  );
  return resultado.rows;
}

/**
 * Verificar si un plato ya está en la semana
 * Spec Etapa 3 - Sección 11: Validar que no se repita el mismo plato en la semana
 */
export async function verificarPlatoEnSemana(db, versionId, platoId) {
  const resultado = await db.query(
    `SELECT COUNT(*) as cantidad FROM opciones_dia_menu odm
     JOIN dias_version_menu dvm ON odm.dia_version_menu_id = dvm.id
     WHERE dvm.version_semana_id = $1 AND odm.plato_id = $2`,
    [versionId, platoId],
  );
  return resultado.rows[0].cantidad > 0;
}

/**
 * Eliminar opción de día
 */
export async function eliminarOpcion(db, opcionId) {
  const resultado = await db.query(
    `DELETE FROM opciones_dia_menu WHERE id = $1 RETURNING *`,
    [opcionId],
  );
  return resultado.rows[0];
}

/**
 * PLANTILLAS
 */

/**
 * Crear plantilla de mensaje
 */
export async function crearPlantilla(
  db,
  {
    nombre,
    tipo,
    plantilla,
    marcaId,
    canalId,
    empresaId,
    configuracion,
    estado,
    esPredeterminada,
    creadoPorId,
  },
) {
  const id = uuid();
  const resultado = await db.query(
    `INSERT INTO plantillas_mensaje_menu
    (id, nombre, tipo, plantilla, marca_id, canal_id, empresa_id, configuracion, estado, es_predeterminada, creado_por, creado_en)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
    RETURNING *`,
    [
      id,
      nombre,
      tipo,
      plantilla,
      marcaId || null,
      canalId || null,
      empresaId || null,
      JSON.stringify(configuracion || {}),
      estado || "ACTIVA",
      esPredeterminada || false,
      creadoPorId,
    ],
  );
  return resultado.rows[0];
}

/**
 * Obtener plantilla por ID
 */
export async function obtenerPlantilla(db, plantillaId) {
  const resultado = await db.query(
    `SELECT * FROM plantillas_mensaje_menu WHERE id = $1 AND eliminado_en IS NULL`,
    [plantillaId],
  );
  return resultado.rows[0];
}

/**
 * Obtener plantillas activas por contexto (marca/canal/empresa)
 */
export async function obtenerPlantillasActivas(
  db,
  marcaId,
  canalId,
  empresaId,
  tipo,
) {
  const resultado = await db.query(
    `WITH candidatas AS (
       SELECT
         p.*,
         CASE
           WHEN p.empresa_id IS NOT NULL THEN 4
           WHEN p.canal_id IS NOT NULL THEN 3
           WHEN p.marca_id IS NOT NULL THEN 2
           ELSE 1
         END AS prioridad
       FROM plantillas_mensaje_menu p
       WHERE p.tipo = $1
         AND p.estado = 'ACTIVA'
         AND p.eliminado_en IS NULL
         AND (p.marca_id IS NULL OR p.marca_id = $2)
         AND (p.canal_id IS NULL OR p.canal_id = $3)
         AND (p.empresa_id IS NULL OR p.empresa_id = $4)
         AND (
           p.empresa_id IS NOT NULL
           OR p.canal_id IS NOT NULL
           OR p.marca_id IS NOT NULL
           OR p.es_predeterminada = true
         )
     )
     SELECT *
     FROM candidatas
     ORDER BY prioridad DESC, es_predeterminada DESC, actualizado_en DESC, creado_en DESC
     LIMIT 1`,
    [tipo, marcaId, canalId, empresaId],
  );
  return resultado.rows[0];
}

export async function contarPlantillasPrioridadEmpatada(
  db,
  marcaId,
  canalId,
  empresaId,
  tipo,
) {
  const resultado = await db.query(
    `WITH candidatas AS (
       SELECT
         CASE
           WHEN p.empresa_id IS NOT NULL THEN 4
           WHEN p.canal_id IS NOT NULL THEN 3
           WHEN p.marca_id IS NOT NULL THEN 2
           ELSE 1
         END AS prioridad
       FROM plantillas_mensaje_menu p
       WHERE p.tipo = $1
         AND p.estado = 'ACTIVA'
         AND p.eliminado_en IS NULL
         AND (p.marca_id IS NULL OR p.marca_id = $2)
         AND (p.canal_id IS NULL OR p.canal_id = $3)
         AND (p.empresa_id IS NULL OR p.empresa_id = $4)
         AND (
           p.empresa_id IS NOT NULL
           OR p.canal_id IS NOT NULL
           OR p.marca_id IS NOT NULL
           OR p.es_predeterminada = true
         )
     ), maxima AS (
       SELECT MAX(prioridad) AS prioridad_maxima FROM candidatas
     )
     SELECT COUNT(*)::int AS cantidad
     FROM candidatas c
     JOIN maxima m ON c.prioridad = m.prioridad_maxima`,
    [tipo, marcaId, canalId, empresaId],
  );

  return resultado.rows[0]?.cantidad || 0;
}

/**
 * IMPORTACIONES
 */

/**
 * Crear registro de importación
 */
export async function crearImportacion(
  db,
  {
    nombreArchivo,
    hashArchivo,
    modoSimulacion,
    estrategiaConflicto,
    ejecutadoPorId,
  },
) {
  const id = uuid();
  const resultado = await db.query(
    `INSERT INTO importaciones_menu
    (id, nombre_archivo, hash_archivo, modo_simulacion, estado, estrategia_conflicto, ejecutado_por, iniciado_en)
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    RETURNING *`,
    [
      id,
      nombreArchivo || "sin-nombre",
      hashArchivo,
      modoSimulacion || false,
      "INICIADA",
      estrategiaConflicto || "ERROR",
      ejecutadoPorId,
    ],
  );
  return resultado.rows[0];
}

/**
 * Obtener importación por ID
 */
export async function obtenerImportacion(db, importacionId) {
  const resultado = await db.query(
    `SELECT * FROM importaciones_menu WHERE id = $1`,
    [importacionId],
  );
  return resultado.rows[0];
}

/**
 * Verificar si un archivo ya tiene una importación real activa o exitosa.
 * Las simulaciones y fallidas no bloquean un nuevo intento.
 */
export async function verificarHashImportado(db, hashArchivo) {
  const resultado = await db.query(
    `SELECT id, estado
     FROM importaciones_menu
     WHERE hash_archivo = $1
       AND modo_simulacion = false
       AND estado IN ('INICIADA', 'VALIDADA', 'COMPLETADA')
     LIMIT 1`,
    [hashArchivo],
  );
  return resultado.rows[0];
}

/**
 * Actualizar estado de importación
 */
export async function actualizarEstadoImportacion(
  db,
  importacionId,
  estado,
  resumen,
  advertencias,
  errores,
) {
  const query = `UPDATE importaciones_menu SET
    estado = $1,
    resumen = $2,
    advertencias = $3,
    errores = $4,
    finalizado_en = NOW()
    WHERE id = $5
    RETURNING *`;

  const resultado = await db.query(query, [
    estado,
    JSON.stringify(resumen || {}),
    JSON.stringify(advertencias || []),
    JSON.stringify(errores || []),
    importacionId,
  ]);
  return resultado.rows[0];
}

/**
 * HISTORIAL Y AUDITORÍA
 */

/**
 * Obtener historial de usos de un plato (solo versiones publicadas/finalizadas)
 * Spec Etapa 3 - Sección 17: No duplicar conteos
 */
export async function obtenerHistorialUsoPlato(db, platoId, marcaId) {
  const resultado = await db.query(
    `SELECT
      sm.id as semana_id,
      sm.fecha_inicio,
      sm.fecha_fin,
      v.id as version_id,
      v.estado,
      dvm.id as dia_id,
      dvm.nombre_dia,
      dvm.fecha
    FROM opciones_dia_menu odm
    JOIN dias_version_menu dvm ON odm.dia_version_menu_id = dvm.id
    JOIN versiones_semana_menu v ON dvm.version_semana_id = v.id
    JOIN semanas_menu sm ON v.semana_menu_id = sm.id
    WHERE odm.plato_id = $1
    AND sm.marca_id = $2
    AND (
      (v.estado = 'PUBLICADO' AND v.es_publicada_actual = true)
      OR v.estado = 'FINALIZADO'
    )
    ORDER BY sm.fecha_inicio DESC`,
    [platoId, marcaId],
  );
  return resultado.rows;
}

/**
 * Registrar auditoría de cambio
 * Spec Etapa 3 - Sección 16: Auditoría
 */
export async function registrarAuditoria(
  db,
  {
    usuarioId,
    entidad,
    entidadId,
    accion,
    valoresAnteriores,
    valoresNuevos,
    motivo,
  },
) {
  const id = uuid();
  const resultado = await db.query(
    `INSERT INTO auditoria
    (id, usuario_id, accion, entidad, entidad_id, datos_anteriores, datos_posteriores, motivo, creado_en)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    RETURNING *`,
    [
      id,
      usuarioId,
      accion,
      entidad,
      entidadId,
      JSON.stringify(valoresAnteriores || {}),
      JSON.stringify(valoresNuevos || {}),
      motivo || null,
    ],
  );
  return resultado.rows[0];
}

/**
 * Utilidades de repositorio
 */

export function paramsPlaceholder(count) {
  return Array.from({ length: count }, (_, i) => `$${i + 1}`).join(", ");
}
