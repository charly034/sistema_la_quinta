import { randomUUID } from "node:crypto";

export async function crearPerfil(db, datos) {
  const id = randomUUID();
  const q = await db.query(
    `INSERT INTO perfiles_reglas (
      id, codigo, nombre, descripcion, estado, marca_id, canal_id, empresa_id,
      es_predeterminado, creado_por, actualizado_por, creado_en, actualizado_en
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10,NOW(),NOW()) RETURNING *`,
    [
      id,
      datos.codigo,
      datos.nombre,
      datos.descripcion || null,
      datos.estado,
      datos.marcaId || null,
      datos.canalId || null,
      datos.empresaId || null,
      !!datos.esPredeterminado,
      datos.usuarioId,
    ],
  );
  return q.rows[0];
}

export async function obtenerPerfilPorId(db, perfilId) {
  const q = await db.query(
    "SELECT * FROM perfiles_reglas WHERE id = $1 AND eliminado_en IS NULL",
    [perfilId],
  );
  return q.rows[0] || null;
}

export async function listarPerfiles(db, filtros) {
  const params = [];
  let i = 1;
  let sql = "SELECT * FROM perfiles_reglas WHERE eliminado_en IS NULL";

  if (filtros.buscar) {
    sql += ` AND (codigo ILIKE $${i} OR nombre ILIKE $${i})`;
    params.push(`%${filtros.buscar}%`);
    i += 1;
  }
  if (filtros.estado) {
    sql += ` AND estado = $${i}`;
    params.push(filtros.estado);
    i += 1;
  }
  if (filtros.marcaId) {
    sql += ` AND marca_id = $${i}`;
    params.push(filtros.marcaId);
    i += 1;
  }
  if (filtros.canalId) {
    sql += ` AND canal_id = $${i}`;
    params.push(filtros.canalId);
    i += 1;
  }
  if (filtros.empresaId) {
    sql += ` AND empresa_id = $${i}`;
    params.push(filtros.empresaId);
    i += 1;
  }

  sql += ` ORDER BY ${filtros.ordenCampo} ${filtros.ordenDireccion}, creado_en DESC`;
  sql += ` LIMIT $${i} OFFSET $${i + 1}`;
  params.push(filtros.limite, filtros.offset);
  const q = await db.query(sql, params);
  return q.rows;
}

export async function actualizarPerfil(db, perfilId, patch, usuarioId) {
  const campos = [];
  const params = [];
  let i = 1;

  const map = {
    codigo: "codigo",
    nombre: "nombre",
    descripcion: "descripcion",
    estado: "estado",
    marcaId: "marca_id",
    canalId: "canal_id",
    empresaId: "empresa_id",
    esPredeterminado: "es_predeterminado",
  };

  for (const [k, v] of Object.entries(map)) {
    if (Object.prototype.hasOwnProperty.call(patch, k)) {
      campos.push(`${v} = $${i}`);
      params.push(patch[k] ?? null);
      i += 1;
    }
  }

  campos.push(`actualizado_por = $${i}`);
  params.push(usuarioId);
  i += 1;
  campos.push("actualizado_en = NOW()");

  params.push(perfilId);
  const q = await db.query(
    `UPDATE perfiles_reglas SET ${campos.join(", ")} WHERE id = $${i} AND eliminado_en IS NULL RETURNING *`,
    params,
  );
  return q.rows[0] || null;
}

export async function obtenerDetallePerfil(db, perfilId) {
  const q = await db.query(
    `SELECT d.*, r.codigo AS regla_codigo, r.tipo AS regla_tipo, r.naturaleza AS regla_naturaleza,
            r.parametros AS regla_parametros, r.peso AS regla_peso, r.prioridad AS regla_prioridad
     FROM perfiles_reglas_detalle d
     JOIN reglas_menu r ON r.id = d.regla_id
     WHERE d.perfil_id = $1
     ORDER BY d.orden ASC, d.creado_en ASC`,
    [perfilId],
  );
  return q.rows;
}

export async function reemplazarReglasPerfil(db, perfilId, reglas) {
  await db.query("DELETE FROM perfiles_reglas_detalle WHERE perfil_id = $1", [
    perfilId,
  ]);

  for (const r of reglas) {
    await db.query(
      `INSERT INTO perfiles_reglas_detalle (
        id, perfil_id, regla_id, orden, activa, peso_personalizado,
        prioridad_personalizada, parametros_personalizados, creado_en, actualizado_en
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,NOW(),NOW())`,
      [
        randomUUID(),
        perfilId,
        r.reglaId,
        r.orden ?? 0,
        r.activa ?? true,
        r.pesoPersonalizado ?? null,
        r.prioridadPersonalizada ?? null,
        r.parametrosPersonalizados
          ? JSON.stringify(r.parametrosPersonalizados)
          : null,
      ],
    );
  }
}

export async function duplicarPerfil(db, perfil, usuarioId) {
  return crearPerfil(db, {
    codigo: `${perfil.codigo}_COPIA`,
    nombre: `${perfil.nombre} (copia)`,
    descripcion: perfil.descripcion,
    estado: "ACTIVO",
    marcaId: perfil.marca_id,
    canalId: perfil.canal_id,
    empresaId: perfil.empresa_id,
    esPredeterminado: false,
    usuarioId,
  });
}

export async function obtenerReglasPorIds(db, ids) {
  if (!ids.length) return [];
  const q = await db.query(
    "SELECT * FROM reglas_menu WHERE id = ANY($1::uuid[]) AND eliminado_en IS NULL",
    [ids],
  );
  return q.rows;
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
