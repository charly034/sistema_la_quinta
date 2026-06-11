import { ApiError } from "../../../utils/api-error.js";
import {
  CODIGOS_PERFIL_INICIALES,
  ESTADOS_VERSION_EDITABLES,
  TRANSICIONES_PROPUESTA_PERMITIDAS,
} from "./propuestas.constantes.js";
import {
  semillaAleatoria,
  huellaVersion,
  fechaHoyIso,
  semanasEntre,
} from "./propuestas.utilidades.js";
import { generarPropuestaDeterminista } from "./motor-propuestas.servicio.js";
import * as repo from "./propuestas.repositorio.js";
import { detectarIncompatibilidadesObligatorias } from "./evaluador-reglas.servicio.js";
import { validarDesactivacionReglasReservadas } from "../reglas/reglas.servicio.js";

function normalizarTipoPorPerfil(codigoPerfil) {
  if (codigoPerfil === "EQUILIBRADO") return "EQUILIBRADA";
  if (codigoPerfil === "HISTORICO") return "HISTORICA";
  if (codigoPerfil === "RENOVACION") return "RENOVACION";
  return "PERSONALIZADA";
}

const TIPOS_OBLIGATORIOS_ETAPA4 = new Set([
  "NO_REPETIR_PLATO_EN_SEMANA",
  "ANTIGUEDAD_MINIMA_PLATO",
  "MAXIMO_CATEGORIA_SEMANA",
  "MINIMO_CATEGORIA_SEMANA",
  "MAXIMO_PROTEINA_SEMANA",
  "MINIMO_PROTEINA_SEMANA",
  "EXCLUIR_PLATOS_INACTIVOS",
  "EXCLUIR_PLATOS_ARCHIVADOS",
  "EXCLUIR_PLATOS_BLOQUEADOS",
  "RESPETAR_TEMPORADA",
]);

function naturalezaEfectivaRegla(regla) {
  const tipo = String(regla?.tipo || regla?.codigo || "");
  if (TIPOS_OBLIGATORIOS_ETAPA4.has(tipo)) return "OBLIGATORIA";
  return regla.naturaleza;
}

function validarTransicionOThrow(estadoActual, evento) {
  const estadosPermitidos = new Set(
    TRANSICIONES_PROPUESTA_PERMITIDAS[evento] || [],
  );
  if (estadosPermitidos.has(estadoActual)) return;

  throw new ApiError(409, "Transición de propuesta no permitida", {
    code: "TRANSICION_PROPUESTA_INVALIDA",
    details: [
      {
        estadoActual,
        evento,
      },
    ],
  });
}

async function construirPosiciones(db, semana, version, opciones = {}) {
  let filas = await repo.obtenerDiasConOpcionesVersion(db, version.id);

  const diasSinOpciones = new Set(
    filas
      .filter((f) => f.estado_dia === "DIA_LABORAL" && !f.opcion_id)
      .map((f) => f.dia_id),
  );

  if (diasSinOpciones.size) {
    const opcionesMarca = await repo.obtenerOpcionesMarcaActivas(
      db,
      semana.marca_id,
    );
    for (const diaId of diasSinOpciones) {
      await repo.crearOpcionesFaltantesDia(db, diaId, opcionesMarca);
    }
    filas = await repo.obtenerDiasConOpcionesVersion(db, version.id);
  }

  const bloqueadasReq = new Set(
    (opciones.posiciones_bloqueadas || []).map(
      (p) => `${p.fecha}::${p.opcion_menu_marca_id}`,
    ),
  );

  const posiciones = [];
  let ordenGlobal = 0;
  for (const f of filas) {
    if (!f.opcion_id) continue;
    if (f.estado_dia !== "DIA_LABORAL") continue;

    const fechaIso = new Date(f.fecha).toISOString().slice(0, 10);
    const claveBloqueo = `${fechaIso}::${f.opcion_menu_marca_id}`;
    const bloqueada =
      Boolean(f.bloqueado_manual) || bloqueadasReq.has(claveBloqueo);

    if (opciones.solo_posiciones_vacias && f.plato_id && !bloqueada) continue;
    if (!opciones.respetar_platos_existentes && !bloqueada) {
      // Se permite regenerar posiciones con plato asignado.
    } else if (f.plato_id && !bloqueada && !opciones.solo_posiciones_vacias) {
      continue;
    }

    posiciones.push({
      clave: `${f.dia_id}::${f.opcion_menu_marca_id}`,
      diaVersionMenuId: f.dia_id,
      fecha: fechaIso,
      opcionMenuMarcaId: f.opcion_menu_marca_id,
      codigoOpcion: f.codigo_opcion,
      nombreOpcion: f.nombre_opcion,
      platoId: f.plato_id,
      platoNombre: null,
      bloqueada,
      orden: Number(f.orden || 0),
      ordenGlobal,
    });
    ordenGlobal += 1;
  }

  return posiciones;
}

async function construirMetricasPorPlato(db, semana, posiciones, candidatos) {
  const metricas = new Map();
  const fechaRef = posiciones[0]?.fecha || fechaHoyIso();
  for (const c of candidatos) {
    const m = await repo.obtenerMetricasHistoricasPlato(
      db,
      c.id,
      semana.marca_id,
      fechaRef,
    );
    metricas.set(c.id, {
      ...m,
      semanas_desde_ultimo_uso: semanasEntre(m.ultima_fecha, fechaRef),
    });
  }
  return metricas;
}

async function resolverReglasEfectivas(db, semana, perfil, overrides = {}) {
  const globales = await repo.obtenerReglasActivasPorContexto(db, {
    marcaId: semana.marca_id,
    canalId: semana.canal_id,
    empresaId: semana.empresa_id,
    fecha: semana.fecha_inicio,
  });

  const detalle = perfil ? await repo.obtenerDetallePerfil(db, perfil.id) : [];
  const map = new Map();

  for (const r of globales) {
    map.set(r.id, {
      ...r,
      naturaleza: naturalezaEfectivaRegla(r),
      origen: r.empresa_id
        ? "EMPRESA"
        : r.canal_id
          ? "CANAL"
          : r.marca_id
            ? "MARCA"
            : "GLOBAL",
    });
  }

  for (const d of detalle) {
    if (!d.activa) continue;
    map.set(d.regla_id, {
      id: d.regla_id,
      codigo: d.regla_codigo,
      tipo: d.regla_tipo,
      naturaleza: naturalezaEfectivaRegla({
        tipo: d.regla_tipo,
        codigo: d.regla_codigo,
        naturaleza: d.regla_naturaleza,
      }),
      prioridad: d.prioridad_personalizada ?? d.regla_prioridad,
      peso: d.peso_personalizado ?? d.regla_peso,
      parametros: d.parametros_personalizados ?? d.regla_parametros,
      origen: "PERFIL",
    });
  }

  const reglas = [...map.values()];

  if (overrides.reglas_desactivadas?.length) {
    validarDesactivacionReglasReservadas(overrides.reglas_desactivadas);
    return reglas.filter(
      (r) => !overrides.reglas_desactivadas.includes(r.codigo),
    );
  }

  return reglas;
}

function versionHuellaDesdePosiciones(posiciones) {
  const serializable = posiciones
    .map((p) => ({
      d: p.diaVersionMenuId,
      o: p.opcionMenuMarcaId,
      plato: p.platoId || null,
      b: p.bloqueada,
    }))
    .sort((a, b) => `${a.d}::${a.o}`.localeCompare(`${b.d}::${b.o}`));
  return huellaVersion(serializable);
}

async function calcularHuellaVersionActual(db, versionId) {
  const filas = await repo.obtenerDiasConOpcionesVersion(db, versionId);
  const serializable = filas
    .filter((f) => f.opcion_id && f.estado_dia === "DIA_LABORAL")
    .map((f) => ({
      d: String(f.dia_id),
      o: String(f.opcion_menu_marca_id),
      plato: f.plato_id ? String(f.plato_id) : null,
      b: Boolean(f.bloqueado_manual),
      fecha: new Date(f.fecha).toISOString().slice(0, 10),
      ordenDia: Number(f.numero_dia_iso || 0),
      ordenOpcion: Number(f.orden || 0),
    }))
    .sort((a, b) => {
      if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha);
      if (a.ordenDia !== b.ordenDia) return a.ordenDia - b.ordenDia;
      if (a.ordenOpcion !== b.ordenOpcion) return a.ordenOpcion - b.ordenOpcion;
      if (a.d !== b.d) return a.d.localeCompare(b.d);
      return a.o.localeCompare(b.o);
    });

  return huellaVersion(serializable);
}

async function generarUnaPropuesta(
  db,
  semana,
  version,
  perfil,
  opciones,
  usuarioId,
) {
  const posiciones = await construirPosiciones(db, semana, version, opciones);
  if (!posiciones.length) {
    throw new ApiError(409, "No hay posiciones generables", {
      code: "SIN_CANDIDATOS",
    });
  }

  const candidatos = await repo.obtenerPlatosCandidatos(db, semana.marca_id);
  if (!candidatos.length) {
    throw new ApiError(409, "No hay platos candidatos elegibles", {
      code: "SIN_CANDIDATOS",
    });
  }

  const reglas = await resolverReglasEfectivas(db, semana, perfil, opciones);
  const incompatibilidades = detectarIncompatibilidadesObligatorias(
    reglas.filter((r) => r.naturaleza === "OBLIGATORIA"),
  );
  if (incompatibilidades.length) {
    throw new ApiError(409, "Reglas obligatorias incompatibles", {
      code: "REGLAS_INCOMPATIBLES",
      details: incompatibilidades,
    });
  }

  const metricasPorPlato = await construirMetricasPorPlato(
    db,
    semana,
    posiciones,
    candidatos,
  );

  const semillaDeterministaPorDefecto = `${semana.id}::${version.id}::${perfil?.id || "SIN_PERFIL"}`;
  const semilla = opciones.variar_resultados
    ? semillaAleatoria()
    : opciones.semilla || semillaDeterministaPorDefecto;
  const motor = generarPropuestaDeterminista({
    semilla,
    posiciones,
    candidatos,
    reglas,
    metricasPorPlato,
  });

  if (
    motor.estado === "INVALIDA" &&
    motor.resumen?.motivoFinalizacion === "POSICION_BLOQUEADA_CONFLICTIVA"
  ) {
    const conflicto = motor.reglasIncumplidas?.find(
      (r) => r.codigo === "POSICION_BLOQUEADA_CONFLICTIVA",
    );

    await repo.registrarAuditoria(db, {
      usuarioId,
      accion: "CONFLICTO_PROPUESTA",
      entidad: "propuestas_menu",
      entidadId: null,
      datosAnteriores: null,
      datosPosteriores: {
        semana_id: semana.id,
        version_id: version.id,
        conflicto,
      },
      motivo: "Una posición bloqueada impide cumplir una regla obligatoria",
    });

    throw new ApiError(
      409,
      "Una posición bloqueada impide cumplir una regla obligatoria",
      {
        code: "POSICION_BLOQUEADA_CONFLICTIVA",
        details: [
          {
            dia_version_menu_id:
              conflicto?.posicion_conflictiva?.dia_id || null,
            opcion_menu_marca_id:
              conflicto?.posicion_conflictiva?.opcion_id || null,
            plato_id: conflicto?.posicion_conflictiva?.plato_id || null,
            regla_id: conflicto?.regla_incumplida?.id || null,
            codigo_regla: conflicto?.regla_incumplida?.codigo || null,
            mensaje:
              conflicto?.mensaje ||
              "Una posición bloqueada impide cumplir una regla obligatoria",
            posiciones_sin_resolver: conflicto?.posiciones_sin_resolver || [],
          },
        ],
      },
    );
  }

  const versionHuellaEstable = await calcularHuellaVersionActual(
    db,
    version.id,
  );

  const propuesta = await repo.crearPropuesta(db, {
    semanaMenuId: semana.id,
    versionSemanaId: version.id,
    perfilReglasId: perfil?.id || null,
    tipo: normalizarTipoPorPerfil(perfil?.codigo),
    estado: motor.estado,
    puntajeTotal: motor.puntajeTotal,
    semilla,
    parametrosGeneracion: {
      ...opciones,
      perfil_codigo: perfil?.codigo || null,
      reglas_aplicadas: reglas.map((r) => ({
        id: r.id,
        codigo: r.codigo,
        origen: r.origen,
      })),
    },
    resumen: motor.resumen,
    reglasIncumplidas: motor.reglasIncumplidas,
    versionActualizadaEn: version.actualizado_en,
    versionHuella: versionHuellaEstable,
    creadoPor: usuarioId,
  });

  await repo.insertarDetallePropuesta(
    db,
    propuesta.id,
    motor.detalle.map((d) => ({
      ...d,
      explicacion: {
        texto: d.explicacion?.texto || "Sin explicación",
        razones: d.explicacion?.razones || [],
        evaluaciones: d.evaluaciones || [],
      },
      metricas: d.metricas || {},
    })),
  );

  await repo.registrarAuditoria(db, {
    usuarioId,
    accion: "GENERAR_PROPUESTA",
    entidad: "propuestas_menu",
    entidadId: propuesta.id,
    datosPosteriores: {
      perfil: perfil?.codigo || null,
      semilla,
      reglas_aplicadas: reglas.map((r) => r.codigo),
      resumen: motor.resumen,
    },
    motivo: "Generación automática de propuesta",
  });

  return obtenerPropuesta(db, semana.id, version.id, propuesta.id);
}

export async function generarTresPropuestas(
  db,
  semanaId,
  versionId,
  body,
  usuarioId,
) {
  const semana = await repo.obtenerSemana(db, semanaId);
  if (!semana)
    throw new ApiError(404, "Semana no encontrada", {
      code: "RECURSO_NO_ENCONTRADO",
    });
  const version = await repo.obtenerVersion(db, versionId);
  if (!version || version.semana_menu_id !== semana.id) {
    throw new ApiError(404, "Versión no encontrada", {
      code: "RECURSO_NO_ENCONTRADO",
    });
  }
  if (!ESTADOS_VERSION_EDITABLES.includes(version.estado)) {
    throw new ApiError(409, "La versión no es editable", {
      code: "VERSION_NO_EDITABLE",
    });
  }

  const propuestas = [];
  for (const codigo of CODIGOS_PERFIL_INICIALES) {
    const perfil = await repo.obtenerPerfilPorCodigo(db, codigo, {
      marcaId: semana.marca_id,
      canalId: semana.canal_id,
      empresaId: semana.empresa_id,
    });
    if (!perfil) continue;

    const semillaPerfil = body.variar_resultados
      ? semillaAleatoria()
      : `${body.semilla || "etapa4"}::${codigo}`;

    const propuesta = await generarUnaPropuesta(
      db,
      semana,
      version,
      perfil,
      { ...body, semilla: semillaPerfil },
      usuarioId,
    );
    propuestas.push(propuesta);
  }

  return {
    propuestas,
    advertencias:
      propuestas.length < 3
        ? [
            "No fue posible generar tres propuestas por falta de perfiles activos en el contexto",
          ]
        : [],
  };
}

export async function generarPropuestaPersonalizada(
  db,
  semanaId,
  versionId,
  body,
  usuarioId,
) {
  const semana = await repo.obtenerSemana(db, semanaId);
  if (!semana)
    throw new ApiError(404, "Semana no encontrada", {
      code: "RECURSO_NO_ENCONTRADO",
    });
  const version = await repo.obtenerVersion(db, versionId);
  if (!version || version.semana_menu_id !== semana.id) {
    throw new ApiError(404, "Versión no encontrada", {
      code: "RECURSO_NO_ENCONTRADO",
    });
  }
  if (!ESTADOS_VERSION_EDITABLES.includes(version.estado)) {
    throw new ApiError(409, "La versión no es editable", {
      code: "VERSION_NO_EDITABLE",
    });
  }

  const perfil = await repo.obtenerPerfilPorId(db, body.perfil_id);
  if (!perfil)
    throw new ApiError(404, "Perfil no encontrado", {
      code: "PERFIL_NO_ENCONTRADO",
    });

  return generarUnaPropuesta(
    db,
    semana,
    version,
    perfil,
    {
      ...body,
      reglas_desactivadas: body.reglas_desactivadas || [],
    },
    usuarioId,
  );
}

export async function listarPropuestas(db, semanaId, versionId, filtros) {
  const propuestas = await repo.listarPropuestas(
    db,
    semanaId,
    versionId,
    filtros,
  );
  return { propuestas };
}

export async function obtenerPropuesta(db, semanaId, versionId, propuestaId) {
  const propuesta = await repo.obtenerPropuesta(
    db,
    propuestaId,
    semanaId,
    versionId,
  );
  if (!propuesta) {
    throw new ApiError(404, "Propuesta no encontrada", {
      code: "PROPUESTA_NO_ENCONTRADA",
    });
  }
  const detalle = await repo.obtenerDetallePropuesta(db, propuestaId);
  return {
    ...propuesta,
    detalle,
  };
}

export async function aprobarPropuesta(
  db,
  semanaId,
  versionId,
  propuestaId,
  usuarioId,
) {
  const propuesta = await repo.obtenerPropuesta(
    db,
    propuestaId,
    semanaId,
    versionId,
  );
  if (!propuesta)
    throw new ApiError(404, "Propuesta no encontrada", {
      code: "PROPUESTA_NO_ENCONTRADA",
    });

  validarTransicionOThrow(propuesta.estado, "APROBAR");

  const actualizada = await repo.actualizarEstadoPropuesta(
    db,
    propuestaId,
    "APROBADA",
    usuarioId,
    {
      aprobadoPor: usuarioId,
      aprobadoEn: new Date().toISOString(),
    },
  );

  await repo.registrarAuditoria(db, {
    usuarioId,
    accion: "APROBAR_PROPUESTA",
    entidad: "propuestas_menu",
    entidadId: propuestaId,
    datosAnteriores: { estado: propuesta.estado },
    datosPosteriores: { estado: actualizada.estado },
    motivo: "Aprobación humana de propuesta",
  });

  return actualizada;
}

export async function descartarPropuesta(
  db,
  semanaId,
  versionId,
  propuestaId,
  motivo,
  usuarioId,
) {
  const propuesta = await repo.obtenerPropuesta(
    db,
    propuestaId,
    semanaId,
    versionId,
  );
  if (!propuesta)
    throw new ApiError(404, "Propuesta no encontrada", {
      code: "PROPUESTA_NO_ENCONTRADA",
    });

  validarTransicionOThrow(propuesta.estado, "DESCARTAR");

  const actualizada = await repo.actualizarEstadoPropuesta(
    db,
    propuestaId,
    "DESCARTADA",
    usuarioId,
    {
      descartadoEn: new Date().toISOString(),
      motivoDescarte: motivo || null,
    },
  );

  await repo.registrarAuditoria(db, {
    usuarioId,
    accion: "DESCARTAR_PROPUESTA",
    entidad: "propuestas_menu",
    entidadId: propuestaId,
    datosAnteriores: { estado: propuesta.estado },
    datosPosteriores: { estado: actualizada.estado, motivo: motivo || null },
    motivo: "Descarte de propuesta",
  });

  return actualizada;
}

export async function aplicarPropuesta(
  db,
  semanaId,
  versionId,
  propuestaId,
  usuarioId,
) {
  const propuestaBase = await repo.obtenerPropuesta(
    db,
    propuestaId,
    semanaId,
    versionId,
  );
  if (!propuestaBase) {
    throw new ApiError(404, "Propuesta no encontrada", {
      code: "PROPUESTA_NO_ENCONTRADA",
    });
  }

  try {
    return await db.ejecutarEnTransaccion(async (tx) => {
      const propuesta = await repo.obtenerPropuesta(
        tx,
        propuestaId,
        semanaId,
        versionId,
      );
      if (!propuesta)
        throw new ApiError(404, "Propuesta no encontrada", {
          code: "PROPUESTA_NO_ENCONTRADA",
        });

      validarTransicionOThrow(propuesta.estado, "APLICAR");

      const version = await repo.obtenerVersion(tx, versionId);
      if (!version)
        throw new ApiError(404, "Versión no encontrada", {
          code: "RECURSO_NO_ENCONTRADO",
        });
      if (!ESTADOS_VERSION_EDITABLES.includes(version.estado)) {
        throw new ApiError(409, "La versión no es editable", {
          code: "VERSION_NO_EDITABLE",
        });
      }

      const semana = await repo.obtenerSemana(tx, semanaId);
      const huellaActual = await calcularHuellaVersionActual(tx, version.id);

      if (
        propuesta.version_huella &&
        huellaActual !== propuesta.version_huella
      ) {
        throw new ApiError(
          409,
          "La propuesta quedó desactualizada frente a la versión actual",
          {
            code: "PROPUESTA_DESACTUALIZADA",
          },
        );
      }

      const failAfterUpdates =
        process.env.NODE_ENV === "test"
          ? Number(process.env.PROPUESTAS_TEST_FAIL_AFTER_UPDATES || 0)
          : 0;

      await repo.aplicarDetallePropuesta(tx, propuestaId, false, {
        failAfterUpdates,
      });
      const actualizada = await repo.actualizarEstadoPropuesta(
        tx,
        propuestaId,
        "APLICADA",
        usuarioId,
      );

      await repo.registrarAuditoria(tx, {
        usuarioId,
        accion: "APLICAR_PROPUESTA",
        entidad: "propuestas_menu",
        entidadId: propuestaId,
        datosAnteriores: { estado: propuesta.estado },
        datosPosteriores: { estado: actualizada.estado },
        motivo: "Aplicación de propuesta sobre versión editable",
      });

      return actualizada;
    });
  } catch (error) {
    if (error?.code === "PROPUESTA_DESACTUALIZADA") {
      await repo.registrarAuditoria(db, {
        usuarioId,
        accion: "PROPUESTA_DESACTUALIZADA",
        entidad: "propuestas_menu",
        entidadId: propuestaId,
        datosAnteriores: { estado: propuestaBase.estado },
        datosPosteriores: null,
        motivo: "Conflicto de huella al intentar aplicar propuesta",
      });
      throw error;
    }

    if (
      error?.code === "TRANSICION_PROPUESTA_INVALIDA" ||
      error?.code === "PROPUESTA_NO_APLICABLE" ||
      error?.code === "FALLO_CONTROLADO_APLICAR_PROPUESTA"
    ) {
      await repo.registrarAuditoria(db, {
        usuarioId,
        accion: "CONFLICTO_PROPUESTA",
        entidad: "propuestas_menu",
        entidadId: propuestaId,
        datosAnteriores: { estado: propuestaBase.estado },
        datosPosteriores: null,
        motivo: error?.message || "Conflicto de propuesta",
      });
    }

    throw error;
  }
}

export async function evaluarContextoReglas(db, payload) {
  const reglas = [];
  if (payload.reglaId) {
    const q = await db.query(
      "SELECT * FROM reglas_menu WHERE id = $1 AND eliminado_en IS NULL",
      [payload.reglaId],
    );
    if (!q.rows[0])
      throw new ApiError(404, "Regla no encontrada", {
        code: "REGLA_NO_ENCONTRADA",
      });
    reglas.push(q.rows[0]);
  }

  if (payload.perfilId) {
    const perfil = await repo.obtenerPerfilPorId(db, payload.perfilId);
    if (!perfil)
      throw new ApiError(404, "Perfil no encontrado", {
        code: "PERFIL_NO_ENCONTRADO",
      });
    const detalle = await repo.obtenerDetallePerfil(db, payload.perfilId);
    for (const d of detalle) {
      reglas.push({
        id: d.regla_id,
        codigo: d.regla_codigo,
        naturaleza: d.regla_naturaleza,
        peso: d.peso_personalizado ?? d.regla_peso,
        prioridad: d.prioridad_personalizada ?? d.regla_prioridad,
        parametros: d.parametros_personalizados ?? d.regla_parametros,
      });
    }
  }

  return {
    reglas: reglas.map((r) => ({
      regla_id: r.id,
      codigo: r.codigo,
      cumplida: true,
      obligatoria: r.naturaleza === "OBLIGATORIA",
      puntaje: 0,
      mensaje: "Evaluación previa disponible",
      metricas: {},
    })),
  };
}
