import { randomUUID } from "node:crypto";

export async function obtenerEmpresa(db, empresaId) {
  if (!empresaId) return null;
  const r = await db.query("SELECT id, marca_id FROM empresas WHERE id = $1", [
    empresaId,
  ]);
  return r.rows[0] || null;
}

export async function crearRegla(db, datos) {
  const id = randomUUID();
  const q = await db.query(
    `INSERT INTO reglas_menu (
      id, codigo, nombre, descripcion, tipo, naturaleza, estado, prioridad, peso,
      parametros, marca_id, canal_id, empresa_id, dia_semana_iso, vigencia_desde,
      vigencia_hasta, mensaje_cumplimiento, mensaje_incumplimiento, creado_por,
      actualizado_por, creado_en, actualizado_en
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12,$13,$14,$15,$16,$17,$18,$19,$19,NOW(),NOW()
    ) RETURNING *`,
    [
      id,
      datos.codigo,
      datos.nombre,
      datos.descripcion || null,
      datos.tipo,
      datos.naturaleza,
      datos.estado,
      datos.prioridad,
      datos.peso,
      JSON.stringify(datos.parametros || {}),
      datos.marcaId || null,
      datos.canalId || null,
      datos.empresaId || null,
      datos.diaSemanaIso || null,
      datos.vigenciaDesde || null,
      datos.vigenciaHasta || null,
      datos.mensajeCumplimiento || null,
      datos.mensajeIncumplimiento || null,
      datos.usuarioId,
    ],
  );
  return q.rows[0];
}

export async function obtenerReglaPorId(db, reglaId) {
  const q = await db.query(
    "SELECT * FROM reglas_menu WHERE id = $1 AND eliminado_en IS NULL",
    [reglaId],
  );
  return q.rows[0] || null;
}

export async function listarReglas(db, filtros) {
  const params = [];
  let i = 1;
  let sql = "SELECT * FROM reglas_menu WHERE eliminado_en IS NULL";

  if (filtros.buscar) {
    sql += ` AND (codigo ILIKE $${i} OR nombre ILIKE $${i})`;
    params.push(`%${filtros.buscar}%`);
    i += 1;
  }
  if (filtros.tipo) {
    sql += ` AND tipo = $${i}`;
    params.push(filtros.tipo);
    i += 1;
  }
  if (filtros.naturaleza) {
    sql += ` AND naturaleza = $${i}`;
    params.push(filtros.naturaleza);
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
  if (filtros.diaSemanaIso) {
    sql += ` AND dia_semana_iso = $${i}`;
    params.push(filtros.diaSemanaIso);
    i += 1;
  }
  if (filtros.vigenteEn) {
    sql += ` AND (vigencia_desde IS NULL OR vigencia_desde <= $${i}) AND (vigencia_hasta IS NULL OR vigencia_hasta >= $${i})`;
    params.push(filtros.vigenteEn);
    i += 1;
  }

  sql += ` ORDER BY ${filtros.ordenCampo} ${filtros.ordenDireccion}, creado_en DESC`;
  sql += ` LIMIT $${i} OFFSET $${i + 1}`;
  params.push(filtros.limite, filtros.offset);

  const q = await db.query(sql, params);
  return q.rows;
}

export async function actualizarRegla(db, reglaId, patch, usuarioId) {
  const campos = [];
  const params = [];
  let i = 1;

  const map = {
    codigo: "codigo",
    nombre: "nombre",
    descripcion: "descripcion",
    tipo: "tipo",
    naturaleza: "naturaleza",
    estado: "estado",
    prioridad: "prioridad",
    peso: "peso",
    marcaId: "marca_id",
    canalId: "canal_id",
    empresaId: "empresa_id",
    diaSemanaIso: "dia_semana_iso",
    vigenciaDesde: "vigencia_desde",
    vigenciaHasta: "vigencia_hasta",
    mensajeCumplimiento: "mensaje_cumplimiento",
    mensajeIncumplimiento: "mensaje_incumplimiento",
  };

  for (const [k, v] of Object.entries(map)) {
    if (Object.prototype.hasOwnProperty.call(patch, k)) {
      campos.push(`${v} = $${i}`);
      params.push(patch[k] ?? null);
      i += 1;
    }
  }

  if (Object.prototype.hasOwnProperty.call(patch, "parametros")) {
    campos.push(`parametros = $${i}::jsonb`);
    params.push(JSON.stringify(patch.parametros || {}));
    i += 1;
  }

  campos.push(`actualizado_por = $${i}`);
  params.push(usuarioId);
  i += 1;

  campos.push("actualizado_en = NOW()");

  params.push(reglaId);
  const q = await db.query(
    `UPDATE reglas_menu SET ${campos.join(", ")} WHERE id = $${i} AND eliminado_en IS NULL RETURNING *`,
    params,
  );
  return q.rows[0] || null;
}

export async function cambiarEstadoRegla(db, reglaId, estado, usuarioId) {
  return actualizarRegla(db, reglaId, { estado }, usuarioId);
}

export async function duplicarRegla(db, regla, usuarioId) {
  const copia = {
    ...regla,
    codigo: `${regla.codigo}_COPIA`,
    nombre: `${regla.nombre} (copia)`,
    usuarioId,
    marcaId: regla.marca_id,
    canalId: regla.canal_id,
    empresaId: regla.empresa_id,
    diaSemanaIso: regla.dia_semana_iso,
    vigenciaDesde: regla.vigencia_desde,
    vigenciaHasta: regla.vigencia_hasta,
    mensajeCumplimiento: regla.mensaje_cumplimiento,
    mensajeIncumplimiento: regla.mensaje_incumplimiento,
  };
  return crearRegla(db, copia);
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
