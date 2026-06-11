import { randomUUID } from "node:crypto";
import {
  addDaysIso,
  bootstrapApi,
  crearPlatoBasico,
  crearUsuarioConRol,
  login,
  obtenerLunesIso,
  obtenerMarcaLaQuinta,
  obtenerOpcionesAyC,
} from "./etapa3g.utils.js";

// Re-export de utilidades base para evitar acoplamiento directo de suites E4D a E3G.
export {
  addDaysIso,
  bootstrapApi,
  crearPlatoBasico,
  crearUsuarioConRol,
  login,
  obtenerLunesIso,
  obtenerMarcaLaQuinta,
  obtenerOpcionesAyC,
};

export async function bootstrapEtapa4D(etiqueta = "etapa4d") {
  const boot = await bootstrapApi(etiqueta);
  const acceso = await login(
    boot.api,
    boot.credenciales.correoProp,
    boot.credenciales.contrasenaProp,
  );

  const owner = {
    token: acceso.body.datos.accessToken,
    id: acceso.body.datos.usuario.id,
  };

  const marca = await obtenerMarcaLaQuinta(boot.getPool());
  const opciones = await obtenerOpcionesAyC(boot.getPool(), marca.id);

  return {
    ...boot,
    owner,
    marca,
    opciones,
  };
}

async function asegurarPerfilConReglas(pool, perfilCodigo, usuarioId) {
  const perfil = await pool.query(
    `SELECT id FROM perfiles_reglas WHERE codigo = $1 AND eliminado_en IS NULL LIMIT 1`,
    [perfilCodigo],
  );
  if (!perfil.rows[0]) return null;

  const reglas = await pool.query(
    `SELECT id FROM reglas_menu WHERE estado = 'ACTIVA' AND eliminado_en IS NULL ORDER BY prioridad DESC, codigo ASC`,
  );

  let orden = 1;
  for (const regla of reglas.rows) {
    await pool.query(
      `INSERT INTO perfiles_reglas_detalle (id, perfil_id, regla_id, orden, activa, creado_en, actualizado_en)
       VALUES ($1,$2,$3,$4,true,NOW(),NOW())
       ON CONFLICT (perfil_id, regla_id) DO NOTHING`,
      [randomUUID(), perfil.rows[0].id, regla.id, orden],
    );
    orden += 1;
  }

  await pool.query(
    `UPDATE perfiles_reglas SET estado = 'ACTIVO', actualizado_por = $2, actualizado_en = NOW(), eliminado_en = NULL WHERE id = $1`,
    [perfil.rows[0].id, usuarioId],
  );

  return perfil.rows[0].id;
}

export async function asegurarPerfilesIniciales(pool, usuarioId) {
  const defs = [
    ["EQUILIBRADO", "Perfil equilibrado"],
    ["HISTORICO", "Perfil historico"],
    ["RENOVACION", "Perfil renovacion"],
  ];

  for (const [codigo, nombre] of defs) {
    await pool.query(
      `INSERT INTO perfiles_reglas (
         id, codigo, nombre, descripcion, estado, es_predeterminado,
         creado_por, actualizado_por, creado_en, actualizado_en
       )
       SELECT $1, $2, $3, $4, 'ACTIVO', true, $5, $5, NOW(), NOW()
       WHERE NOT EXISTS (
         SELECT 1 FROM perfiles_reglas WHERE codigo = $2 AND eliminado_en IS NULL
       )`,
      [randomUUID(), codigo, nombre, `Creado por ${codigo}`, usuarioId],
    );
  }

  await asegurarPerfilConReglas(pool, "EQUILIBRADO", usuarioId);
  await asegurarPerfilConReglas(pool, "HISTORICO", usuarioId);
  await asegurarPerfilConReglas(pool, "RENOVACION", usuarioId);
}

export async function crearFixtureDefinitiva({
  api,
  pool,
  owner,
  marca,
  opciones,
  weekOffset = 260,
}) {
  const runTag = `E4D-${Date.now()}-${randomUUID().slice(0, 6)}`;

  const categorias = await pool.query(
    `SELECT id, codigo FROM categorias_plato WHERE marca_id = $1 ORDER BY codigo ASC LIMIT 8`,
    [marca.id],
  );
  const proteinas = await pool.query(
    `SELECT id, codigo FROM proteinas WHERE marca_id = $1 ORDER BY codigo ASC LIMIT 8`,
    [marca.id],
  );

  if (categorias.rows.length < 5 || proteinas.rows.length < 5) {
    throw new Error("Fixture E4D requiere al menos 5 categorias y 5 proteinas");
  }

  const platos = [];
  for (let i = 0; i < 24; i += 1) {
    const plato = await crearPlatoBasico(pool, {
      marcaId: marca.id,
      nombre: `${runTag} Plato ${String(i + 1).padStart(2, "0")}`,
      codigo: `${runTag.replace(/-/g, "_")}_${String(i + 1).padStart(2, "0")}`,
      usuarioId: owner.id,
    });

    const categoria = categorias.rows[i % 5];
    const proteina = proteinas.rows[(i + 1) % 5];

    await pool.query(
      `INSERT INTO platos_categorias (plato_id, categoria_id, creado_en)
       VALUES ($1,$2,NOW()) ON CONFLICT DO NOTHING`,
      [plato.id, categoria.id],
    );
    await pool.query(
      `INSERT INTO platos_proteinas (plato_id, proteina_id, creado_en)
       VALUES ($1,$2,NOW()) ON CONFLICT DO NOTHING`,
      [plato.id, proteina.id],
    );

    if (i < 4) {
      await pool.query(`UPDATE platos SET favorito = true WHERE id = $1`, [
        plato.id,
      ]);
    }

    platos.push(plato);
  }

  const especialInactivo = await crearPlatoBasico(pool, {
    marcaId: marca.id,
    nombre: `${runTag} Especial Inactivo`,
    codigo: `${runTag.replace(/-/g, "_")}_INACTIVO`,
    usuarioId: owner.id,
    estado: "INACTIVO",
  });
  const especialArchivado = await crearPlatoBasico(pool, {
    marcaId: marca.id,
    nombre: `${runTag} Especial Archivado`,
    codigo: `${runTag.replace(/-/g, "_")}_ARCHIVADO`,
    usuarioId: owner.id,
    estado: "ARCHIVADO",
  });
  const especialBloqueado = await crearPlatoBasico(pool, {
    marcaId: marca.id,
    nombre: `${runTag} Especial Bloqueado`,
    codigo: `${runTag.replace(/-/g, "_")}_BLOQUEADO`,
    usuarioId: owner.id,
  });
  const hoy = new Date().toISOString().slice(0, 10);
  await pool.query(
    `UPDATE platos
     SET estado = 'BLOQUEADO_TEMPORALMENTE', bloqueado_desde = $2, bloqueado_hasta = $3
     WHERE id = $1`,
    [especialBloqueado.id, addDaysIso(hoy, -2), addDaysIso(hoy, 30)],
  );

  const especialFueraTemporada = await crearPlatoBasico(pool, {
    marcaId: marca.id,
    nombre: `${runTag} Especial Fuera Temporada`,
    codigo: `${runTag.replace(/-/g, "_")}_OUTSEASON`,
    usuarioId: owner.id,
  });
  await pool.query(
    `UPDATE platos SET es_estacional = true, temporada_desde = 2, temporada_hasta = 2 WHERE id = $1`,
    [especialFueraTemporada.id],
  );

  const grupos = {
    favoritos: platos.slice(0, 4).map((p) => p.id),
    muyFrecuentes: platos.slice(4, 8).map((p) => p.id),
    frecuentesPorDia: platos.slice(8, 12).map((p) => p.id),
    usadosRecientes: platos.slice(12, 16).map((p) => p.id),
    usadosAntiguos: platos.slice(16, 20).map((p) => p.id),
    nuncaUtilizados: platos.slice(20, 24).map((p) => p.id),
  };

  const historicos = [0, 2, 4, 6].map((delta) =>
    obtenerLunesIso(weekOffset + delta),
  );
  const objetivoLunes = obtenerLunesIso(weekOffset + 10);

  for (let w = 0; w < historicos.length; w += 1) {
    const lunes = historicos[w];
    const crear = await api
      .post("/api/v1/menu/semanas")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        marcaId: marca.id,
        canalId: null,
        empresaId: null,
        fechaInicio: lunes,
        fechaFin: addDaysIso(lunes, 6),
      });

    const semanaId = crear.body.datos.semana.id;
    const versionId = crear.body.datos.versionInicial.id;

    await api
      .put(
        `/api/v1/menu/semanas/${semanaId}/versiones/${versionId}/dias/${lunes}`,
      )
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ estado: "FERIADO", observaciones: `${runTag} feriado` });

    for (let i = 1; i <= 5; i += 1) {
      const fecha = addDaysIso(lunes, i);
      await api
        .put(
          `/api/v1/menu/semanas/${semanaId}/versiones/${versionId}/dias/${fecha}`,
        )
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          estado: "DIA_LABORAL",
          observaciones: `${runTag} hist ${w}-${i}`,
        });

      const idxA =
        w < 2
          ? grupos.usadosAntiguos[(i - 1) % 4]
          : grupos.usadosRecientes[(i - 1) % 4];
      const idxC =
        i <= 4 ? grupos.frecuentesPorDia[i - 1] : grupos.muyFrecuentes[w % 4];

      await api
        .put(
          `/api/v1/menu/semanas/${semanaId}/versiones/${versionId}/dias/${fecha}/opciones`,
        )
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          opciones: [
            {
              opcionMenuMarcaId: opciones.A.id,
              platoId: idxA,
              orden: 1,
              bloqueadoManual: false,
            },
            {
              opcionMenuMarcaId: opciones.C.id,
              platoId: idxC,
              orden: 2,
              bloqueadoManual: false,
            },
          ],
        });
    }

    await api
      .post(`/api/v1/menu/semanas/${semanaId}/versiones/${versionId}/proponer`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({});
    await api
      .post(`/api/v1/menu/semanas/${semanaId}/versiones/${versionId}/aprobar`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({});
    await api
      .post(`/api/v1/menu/semanas/${semanaId}/versiones/${versionId}/publicar`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({});
  }

  const crearObjetivo = await api
    .post("/api/v1/menu/semanas")
    .set("Authorization", `Bearer ${owner.token}`)
    .send({
      marcaId: marca.id,
      canalId: null,
      empresaId: null,
      fechaInicio: objetivoLunes,
      fechaFin: addDaysIso(objetivoLunes, 6),
    });

  const semanaId = crearObjetivo.body.datos.semana.id;
  const versionId = crearObjetivo.body.datos.versionInicial.id;

  await api
    .put(
      `/api/v1/menu/semanas/${semanaId}/versiones/${versionId}/dias/${objetivoLunes}`,
    )
    .set("Authorization", `Bearer ${owner.token}`)
    .send({
      estado: "SIN_CONFIGURAR",
      observaciones: `${runTag} feriado alternativo`,
    });

  for (let i = 1; i <= 5; i += 1) {
    const fecha = addDaysIso(objetivoLunes, i);
    await api
      .put(
        `/api/v1/menu/semanas/${semanaId}/versiones/${versionId}/dias/${fecha}`,
      )
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        estado: "DIA_LABORAL",
        observaciones: `${runTag} objetivo ${i}`,
      });

    await api
      .put(
        `/api/v1/menu/semanas/${semanaId}/versiones/${versionId}/dias/${fecha}/opciones`,
      )
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        opciones: [
          {
            opcionMenuMarcaId: opciones.A.id,
            platoId: grupos.muyFrecuentes[(i - 1) % 4],
            orden: 1,
            bloqueadoManual: i === 1,
          },
          {
            opcionMenuMarcaId: opciones.C.id,
            platoId: grupos.favoritos[(i - 1) % 4],
            orden: 2,
            bloqueadoManual: false,
          },
        ],
      });
  }

  await asegurarPerfilesIniciales(pool, owner.id);

  const roles = {
    CLIENTE: await crearUsuarioConRol(api, owner.token, "CLIENTE", runTag),
    LECTOR: await crearUsuarioConRol(api, owner.token, "LECTOR", runTag),
    EDITOR: await crearUsuarioConRol(api, owner.token, "EDITOR", runTag),
    ADMINISTRADOR: await crearUsuarioConRol(
      api,
      owner.token,
      "ADMINISTRADOR",
      runTag,
    ),
    PROPIETARIO: owner,
  };

  return {
    runTag,
    semanaId,
    versionId,
    lunes: objetivoLunes,
    platos,
    grupos,
    especiales: {
      inactivo: especialInactivo,
      archivado: especialArchivado,
      bloqueado: especialBloqueado,
      fueraTemporada: especialFueraTemporada,
    },
    categorias: categorias.rows,
    proteinas: proteinas.rows,
    roles,
  };
}

export async function limpiarFixtureDefinitiva(pool, runTag) {
  const prefijo = `${runTag.replace(/-/g, "_")}%`;

  // Borrar propuestas relacionadas
  await pool.query(
    `DELETE FROM propuestas_menu
     WHERE dia_version_menu_id IN (
       SELECT id FROM dias_version_menu d
       WHERE d.observaciones ILIKE $1
     )`,
    [`${runTag}%`],
  );

  // Borrar opciones relacionadas
  await pool.query(
    `DELETE FROM opciones_dia_menu
     WHERE dia_version_menu_id IN (
       SELECT id FROM dias_version_menu d
       WHERE d.observaciones ILIKE $1
     )`,
    [`${runTag}%`],
  );

  // Borrar días
  await pool.query(
    `DELETE FROM dias_version_menu
     WHERE observaciones ILIKE $1`,
    [`${runTag}%`],
  );

  // Borrar versiones
  const versiones = await pool.query(
    `SELECT v.id FROM versiones_semana_menu v
     WHERE v.semana_menu_id IN (
       SELECT s.id FROM semanas_menu s
       WHERE s.codigo ILIKE $1 OR s.nombre ILIKE $1
     )`,
    [prefijo],
  );

  for (const row of versiones.rows) {
    await pool.query("DELETE FROM versiones_semana_menu WHERE id = $1", [
      row.id,
    ]);
  }

  // Borrar semanas
  const semanas = await pool.query(
    `SELECT id FROM semanas_menu
     WHERE codigo ILIKE $1 OR nombre ILIKE $1`,
    [prefijo],
  );

  for (const row of semanas.rows) {
    await pool.query("DELETE FROM semanas_menu WHERE id = $1", [row.id]);
  }

  await pool.query("DELETE FROM platos WHERE codigo ILIKE $1", [prefijo]);
}

export async function obtenerAuditoriaPorAccion(
  pool,
  accion,
  entidadId = null,
) {
  const q = await pool.query(
    `SELECT * FROM auditoria WHERE accion = $1 ${entidadId ? "AND entidad_id = $2" : ""} ORDER BY creado_en DESC LIMIT 20`,
    entidadId ? [accion, entidadId] : [accion],
  );
  return q.rows;
}

export function calcularMetricasPropuesta(detalle = []) {
  const categorias = new Set();
  const proteinas = new Set();
  const platos = new Set();
  let afinidadHistoricaTotal = 0;
  let semanasTotales = 0;
  let semanasCount = 0;
  let nuncaUsados = 0;
  let favoritos = 0;
  let repeticionesConsecutivas = 0;

  let anterior = null;

  for (const d of detalle) {
    if (d.posicion_bloqueada) continue;
    if (d.metricas?.categoria_id)
      categorias.add(String(d.metricas.categoria_id));
    if (d.metricas?.proteina_id) proteinas.add(String(d.metricas.proteina_id));
    if (d.plato_id) platos.add(String(d.plato_id));

    const usosDia = Number(d.metricas?.usos_mismo_dia || 0);
    afinidadHistoricaTotal += usosDia;

    const semanas = d.evaluaciones?.find(
      (e) => e.codigo === "ANTIGUEDAD_MINIMA_PLATO",
    )?.metricas?.semanas_desde_ultimo_uso;
    if (Number.isFinite(Number(semanas))) {
      semanasTotales += Number(semanas);
      semanasCount += 1;
    }

    if (Number(d.metricas?.usos_totales || 0) === 0) nuncaUsados += 1;
    if (d.explicacion?.razones?.includes("es un plato marcado como favorito")) {
      favoritos += 1;
    }

    if (anterior && anterior.plato_id && anterior.plato_id === d.plato_id) {
      repeticionesConsecutivas += 1;
    }
    anterior = d;
  }

  return {
    cantidadCategoriasDistintas: categorias.size,
    cantidadProteinasDistintas: proteinas.size,
    repeticionesConsecutivas,
    afinidadHistoricaTotal,
    promedioSemanasDesdeUltimoUso: semanasCount
      ? Number((semanasTotales / semanasCount).toFixed(4))
      : 0,
    cantidadPlatosNuncaUtilizados: nuncaUsados,
    cantidadFavoritos: favoritos,
  };
}
