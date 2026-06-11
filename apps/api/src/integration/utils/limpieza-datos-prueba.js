/**
 * Utilidad de limpieza selectiva para suites de integración.
 *
 * Elimina SOLO los datos identificados por `prefijo` en códigos de platos,
 * correos de usuarios y observaciones de semanas.  No toca datos de otras
 * suites ni seeds estructurales.
 *
 * Respeta el orden de claves foráneas:
 *  1. detalles de propuestas
 *  2. propuestas (cabecera)
 *  3. auditorías asociadas a esas propuestas
 *  4. opciones de días (opciones_dia_menu)
 *  5. días (dias_version_menu)
 *  6. versiones (versiones_semana_menu)
 *  7. semanas (semanas_menu)
 *  8. relaciones de perfiles con reglas de la suite
 *  9. perfiles propios de la suite
 * 10. reglas propias de la suite
 * 11. relaciones plato↔categoría / plato↔proteína
 * 12. platos propios de la suite
 * 13. usuarios propios de la suite
 */

/**
 * @param {import('pg').Pool} pool
 * @param {string} prefijo  Prefijo único de la corrida, p. ej. "E4B_1750123456"
 */
export async function limpiarDatosPrueba(pool, prefijo) {
  if (!prefijo || prefijo.length < 3) {
    throw new Error("limpiarDatosPrueba: prefijo demasiado corto, abortando");
  }
  const like = `${prefijo}%`;

  // IDs de semanas propias de esta corrida
  const semanasRes = await pool.query(
    `SELECT id FROM semanas_menu WHERE observaciones_admin LIKE $1`,
    [like],
  );
  const semanaIds = semanasRes.rows.map((r) => r.id);

  if (semanaIds.length) {
    const versionesRes = await pool.query(
      `SELECT id FROM versiones_semana_menu WHERE semana_menu_id = ANY($1::uuid[])`,
      [semanaIds],
    );
    const versionIds = versionesRes.rows.map((r) => r.id);

    const diasRes = versionIds.length
      ? await pool.query(
          `SELECT id FROM dias_version_menu WHERE version_semana_id = ANY($1::uuid[])`,
          [versionIds],
        )
      : { rows: [] };
    const diaIds = diasRes.rows.map((r) => r.id);

    const propuestasRes = versionIds.length
      ? await pool.query(
          `SELECT id FROM propuestas_menu WHERE version_semana_id = ANY($1::uuid[])`,
          [versionIds],
        )
      : { rows: [] };
    const propuestaIds = propuestasRes.rows.map((r) => r.id);

    // 1. Detalles de propuestas
    if (diaIds.length) {
      await pool.query(
        `DELETE FROM propuestas_menu_detalle WHERE dia_version_menu_id = ANY($1::uuid[])`,
        [diaIds],
      );
    }

    // 2. Propuestas (cabecera)
    if (propuestaIds.length) {
      await pool.query(
        `DELETE FROM propuestas_menu WHERE id = ANY($1::uuid[])`,
        [propuestaIds],
      );
    }

    // 3. Auditorías asociadas (por entidad_id de propuestas o versiones)
    const auditIds = [...propuestaIds, ...versionIds];
    if (auditIds.length) {
      await pool.query(
        `DELETE FROM auditoria WHERE entidad_id = ANY($1::text[])`,
        [auditIds.map(String)],
      );
    }

    // 4. Opciones de días
    if (diaIds.length) {
      await pool.query(
        `DELETE FROM opciones_dia_menu WHERE dia_version_menu_id = ANY($1::uuid[])`,
        [diaIds],
      );
    }

    // 5. Días
    if (versionIds.length) {
      await pool.query(
        `DELETE FROM dias_version_menu WHERE version_semana_id = ANY($1::uuid[])`,
        [versionIds],
      );
    }

    // 6. Versiones
    if (semanaIds.length) {
      await pool.query(
        `DELETE FROM versiones_semana_menu WHERE semana_menu_id = ANY($1::uuid[])`,
        [semanaIds],
      );
    }

    // 7. Semanas
    await pool.query(`DELETE FROM semanas_menu WHERE id = ANY($1::uuid[])`, [
      semanaIds,
    ]);
  }

  // IDs de platos propios de esta corrida
  const platosRes = await pool.query(
    `SELECT id FROM platos WHERE codigo LIKE $1`,
    [like],
  );
  const platoIds = platosRes.rows.map((r) => r.id);

  // 11. Relaciones plato↔categoría / plato↔proteína
  if (platoIds.length) {
    await pool.query(
      `DELETE FROM platos_categorias WHERE plato_id = ANY($1::uuid[])`,
      [platoIds],
    );
    await pool.query(
      `DELETE FROM platos_proteinas WHERE plato_id = ANY($1::uuid[])`,
      [platoIds],
    );
  }

  // 12. Platos
  if (platoIds.length) {
    await pool.query(`DELETE FROM platos WHERE id = ANY($1::uuid[])`, [
      platoIds,
    ]);
  }

  // 8. Relaciones de perfiles propios de la suite con reglas
  const perfilesRes = await pool.query(
    `SELECT id FROM perfiles_reglas WHERE codigo LIKE $1`,
    [like],
  );
  const perfilIds = perfilesRes.rows.map((r) => r.id);
  if (perfilIds.length) {
    await pool.query(
      `DELETE FROM perfiles_reglas_detalle WHERE perfil_id = ANY($1::uuid[])`,
      [perfilIds],
    );
  }

  // 9. Perfiles propios
  if (perfilIds.length) {
    await pool.query(`DELETE FROM perfiles_reglas WHERE id = ANY($1::uuid[])`, [
      perfilIds,
    ]);
  }

  // 10. Reglas propias de la suite
  await pool.query(`DELETE FROM reglas_menu WHERE codigo LIKE $1`, [like]);

  // 13. Usuarios propios de la suite (correo contiene prefijo)
  await pool.query(`DELETE FROM usuarios WHERE correo LIKE $1`, [
    `%.${prefijo.toLowerCase()}%`,
  ]);
}
