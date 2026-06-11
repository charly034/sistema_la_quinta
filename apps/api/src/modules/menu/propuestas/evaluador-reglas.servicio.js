import { semanasEntre } from "./propuestas.utilidades.js";

function idsComoSet(arr) {
  return new Set((arr || []).map((x) => String(x)));
}

function tamInterseccion(a, b) {
  let c = 0;
  for (const x of a) {
    if (b.has(x)) c += 1;
  }
  return c;
}

function diaMesDesdeValor(valor) {
  if (valor == null) return null;

  const raw = String(valor).trim();
  if (!raw) return null;

  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const mm = Number(raw.slice(5, 7));
    const dd = Number(raw.slice(8, 10));
    return mm * 100 + dd;
  }

  if (/^\d{8}$/.test(raw)) {
    const mm = Number(raw.slice(4, 6));
    const dd = Number(raw.slice(6, 8));
    return mm * 100 + dd;
  }

  if (/^\d{3,4}$/.test(raw)) {
    const v = Number(raw);
    if (v >= 101 && v <= 1231) return v;
  }

  return null;
}

function estaEnTemporada(candidato, fechaObjetivo) {
  if (!candidato.es_estacional) return true;
  if (!candidato.temporada_desde || !candidato.temporada_hasta) return false;

  const desdeNum = Number(candidato.temporada_desde);
  const hastaNum = Number(candidato.temporada_hasta);
  if (
    Number.isFinite(desdeNum) &&
    Number.isFinite(hastaNum) &&
    desdeNum >= 1 &&
    desdeNum <= 12 &&
    hastaNum >= 1 &&
    hastaNum <= 12
  ) {
    const mes = Number(String(fechaObjetivo).slice(5, 7));
    // Temporada sin cruce de año: desde <= hasta (ej. 3→9)
    if (desdeNum <= hastaNum) {
      return mes >= desdeNum && mes <= hastaNum;
    }
    // Temporada con cruce de año: desde > hasta (ej. 12→1 abarca dic y ene)
    return mes >= desdeNum || mes <= hastaNum;
  }

  const fecha = diaMesDesdeValor(fechaObjetivo);
  const desde = diaMesDesdeValor(candidato.temporada_desde);
  const hasta = diaMesDesdeValor(candidato.temporada_hasta);
  if (!fecha || !desde || !hasta) return false;

  return fecha >= desde && fecha <= hasta;
}

function bloquearPorMaximos(contexto, candidatoCategorias, candidatoProteinas) {
  for (const regla of contexto.reglasObligatorias) {
    if (regla.codigo === "MAXIMO_CATEGORIA_SEMANA") {
      const categoriaId = String(regla.parametros?.categoria_id || "");
      const maximo = Number(regla.parametros?.cantidad || 0);
      if (!categoriaId) continue;
      const actual = Number(contexto.conteosCategorias?.get(categoriaId) || 0);
      const agrega = candidatoCategorias.has(categoriaId) ? 1 : 0;
      if (actual + agrega > maximo) {
        return {
          bloquea: true,
          codigo: regla.codigo,
          mensaje: `Supera máximo semanal de categoría (${actual + agrega}/${maximo})`,
          metricas: { categoria_id: categoriaId, actual, maximo, agrega },
          reglaId: regla.id,
        };
      }
    }

    if (regla.codigo === "MAXIMO_PROTEINA_SEMANA") {
      const proteinaId = String(regla.parametros?.proteina_id || "");
      const maximo = Number(regla.parametros?.cantidad || 0);
      if (!proteinaId) continue;
      const actual = Number(contexto.conteosProteinas?.get(proteinaId) || 0);
      const agrega = candidatoProteinas.has(proteinaId) ? 1 : 0;
      if (actual + agrega > maximo) {
        return {
          bloquea: true,
          codigo: regla.codigo,
          mensaje: `Supera máximo semanal de proteína (${actual + agrega}/${maximo})`,
          metricas: { proteina_id: proteinaId, actual, maximo, agrega },
          reglaId: regla.id,
        };
      }
    }
  }

  return null;
}

export function evaluarObligatoriasParaCandidato(contexto) {
  const resultados = [];
  const candidatoCategorias = idsComoSet(contexto.candidato.categorias);
  const candidatoProteinas = idsComoSet(contexto.candidato.proteinas);

  const bloqueoMaximos = bloquearPorMaximos(
    contexto,
    candidatoCategorias,
    candidatoProteinas,
  );
  if (bloqueoMaximos) {
    resultados.push({
      regla_id: bloqueoMaximos.reglaId,
      codigo: bloqueoMaximos.codigo,
      cumplida: false,
      obligatoria: true,
      bloquea: true,
      puntaje: 0,
      mensaje: bloqueoMaximos.mensaje,
      metricas: bloqueoMaximos.metricas,
    });
  }

  const reglaNoRepetir = contexto.reglasObligatorias.find(
    (r) => r.codigo === "NO_REPETIR_PLATO_EN_SEMANA",
  );
  if (reglaNoRepetir) {
    const repetido = contexto.platosYaAsignados.has(contexto.candidato.id);
    resultados.push({
      regla_id: reglaNoRepetir.id,
      codigo: reglaNoRepetir.codigo,
      cumplida: !repetido,
      obligatoria: true,
      bloquea: repetido,
      puntaje: 0,
      mensaje: repetido
        ? "El plato ya está asignado en esta semana"
        : "No repite plato en la semana",
      metricas: {},
    });
  }

  const reglaAntiguedad = contexto.reglasObligatorias.find(
    (r) => r.codigo === "ANTIGUEDAD_MINIMA_PLATO",
  );
  if (reglaAntiguedad) {
    const minimo = Number(reglaAntiguedad.parametros?.semanas_minimas || 0);
    const semanas =
      semanasEntre(contexto.metricas.ultima_fecha, contexto.fechaObjetivo) ||
      999;
    const cumple = semanas >= minimo;
    resultados.push({
      regla_id: reglaAntiguedad.id,
      codigo: reglaAntiguedad.codigo,
      cumplida: cumple,
      obligatoria: true,
      bloquea: !cumple,
      puntaje: 0,
      mensaje: cumple
        ? `Cumple antigüedad mínima (${semanas} semanas)`
        : `El plato fue utilizado hace ${semanas} semanas y el mínimo es ${minimo}`,
      metricas: { semanas_desde_ultimo_uso: semanas, semanas_minimas: minimo },
    });
  }

  const reglaExcluirInactivos = contexto.reglasObligatorias.find(
    (r) => r.codigo === "EXCLUIR_PLATOS_INACTIVOS",
  );
  if (reglaExcluirInactivos) {
    const bloquea = contexto.candidato.estado === "INACTIVO";
    resultados.push({
      regla_id: reglaExcluirInactivos.id,
      codigo: reglaExcluirInactivos.codigo,
      cumplida: !bloquea,
      obligatoria: true,
      bloquea,
      puntaje: 0,
      mensaje: bloquea ? "Plato inactivo excluido" : "Plato activo permitido",
      metricas: { estado: contexto.candidato.estado },
    });
  }

  const reglaExcluirArchivados = contexto.reglasObligatorias.find(
    (r) => r.codigo === "EXCLUIR_PLATOS_ARCHIVADOS",
  );
  if (reglaExcluirArchivados) {
    const bloquea = contexto.candidato.estado === "ARCHIVADO";
    resultados.push({
      regla_id: reglaExcluirArchivados.id,
      codigo: reglaExcluirArchivados.codigo,
      cumplida: !bloquea,
      obligatoria: true,
      bloquea,
      puntaje: 0,
      mensaje: bloquea
        ? "Plato archivado excluido"
        : "Plato no archivado permitido",
      metricas: { estado: contexto.candidato.estado },
    });
  }

  const reglaExcluirBloqueados = contexto.reglasObligatorias.find(
    (r) => r.codigo === "EXCLUIR_PLATOS_BLOQUEADOS",
  );
  if (reglaExcluirBloqueados) {
    const desde = contexto.candidato.bloqueado_desde
      ? String(contexto.candidato.bloqueado_desde).slice(0, 10)
      : null;
    const hasta = contexto.candidato.bloqueado_hasta
      ? String(contexto.candidato.bloqueado_hasta).slice(0, 10)
      : null;
    const tieneBloqueo = Boolean(desde || hasta);
    const bloquea =
      tieneBloqueo &&
      (!desde || desde <= contexto.fechaObjetivo) &&
      (!hasta || hasta >= contexto.fechaObjetivo);
    resultados.push({
      regla_id: reglaExcluirBloqueados.id,
      codigo: reglaExcluirBloqueados.codigo,
      cumplida: !bloquea,
      obligatoria: true,
      bloquea,
      puntaje: 0,
      mensaje: bloquea
        ? "Plato bloqueado excluido"
        : "Plato no bloqueado permitido",
      metricas: { bloqueado_desde: desde, bloqueado_hasta: hasta },
    });
  }

  const reglaTemporada = contexto.reglasObligatorias.find(
    (r) => r.codigo === "RESPETAR_TEMPORADA",
  );
  if (reglaTemporada) {
    const cumple = estaEnTemporada(contexto.candidato, contexto.fechaObjetivo);
    resultados.push({
      regla_id: reglaTemporada.id,
      codigo: reglaTemporada.codigo,
      cumplida: cumple,
      obligatoria: true,
      bloquea: !cumple,
      puntaje: 0,
      mensaje: cumple ? "Plato en temporada" : "Plato fuera de temporada",
      metricas: {
        es_estacional: Boolean(contexto.candidato.es_estacional),
        temporada_desde: contexto.candidato.temporada_desde || null,
        temporada_hasta: contexto.candidato.temporada_hasta || null,
      },
    });
  }

  return resultados;
}

export function puntuarPreferenciales(contexto) {
  const detalles = [];
  let total = 0;
  const candidatoCategorias = idsComoSet(contexto.candidato.categorias);
  const candidatoProteinas = idsComoSet(contexto.candidato.proteinas);
  const categoriasUsadas = contexto.categoriasUsadas || new Set();
  const proteinasUsadas = contexto.proteinasUsadas || new Set();
  const categoriasPrevias = contexto.categoriasPrevias || new Set();
  const proteinasPrevias = contexto.proteinasPrevias || new Set();

  for (const regla of contexto.reglasPreferenciales) {
    let delta = 0;
    let premio = 0;
    let penalizacion = 0;
    const puntajeBase = 0;
    const factor = Number(regla.parametros?.factor || 1);

    switch (regla.codigo) {
      case "PRIORIZAR_HISTORICO_POR_DIA":
        delta =
          Number(contexto.metricas.usos_mismo_dia || 0) *
          factor *
          Number(regla.peso || 0);
        break;
      case "PRIORIZAR_RENOVACION":
      case "PRIORIZAR_PLATOS_MENOS_USADOS": {
        const semanas =
          semanasEntre(
            contexto.metricas.ultima_fecha,
            contexto.fechaObjetivo,
          ) || 0;
        delta = semanas * factor * Number(regla.peso || 0) * 0.1;
        break;
      }
      case "PRIORIZAR_PLATOS_MAS_USADOS":
        delta =
          Number(contexto.metricas.usos_totales || 0) *
          factor *
          Number(regla.peso || 0) *
          0.1;
        break;
      case "PRIORIZAR_FAVORITOS":
        delta = contexto.candidato.favorito ? Number(regla.peso || 0) : 0;
        break;
      case "PREMIAR_VARIEDAD_CATEGORIAS": {
        const nuevas = [...candidatoCategorias].filter(
          (id) => !categoriasUsadas.has(id),
        ).length;
        delta = nuevas * Number(regla.peso || 0) * factor;
        break;
      }
      case "PREMIAR_VARIEDAD_PROTEINAS": {
        const nuevas = [...candidatoProteinas].filter(
          (id) => !proteinasUsadas.has(id),
        ).length;
        delta = nuevas * Number(regla.peso || 0) * factor;
        break;
      }
      case "EVITAR_CATEGORIA_DIAS_CONSECUTIVOS": {
        const repetidas = tamInterseccion(
          candidatoCategorias,
          categoriasPrevias,
        );
        delta =
          repetidas > 0
            ? -Math.abs(Number(regla.peso || 0)) * repetidas
            : Math.abs(Number(regla.peso || 0)) * 0.25;
        break;
      }
      case "EVITAR_PROTEINA_DIAS_CONSECUTIVOS": {
        const repetidas = tamInterseccion(candidatoProteinas, proteinasPrevias);
        delta =
          repetidas > 0
            ? -Math.abs(Number(regla.peso || 0)) * repetidas
            : Math.abs(Number(regla.peso || 0)) * 0.25;
        break;
      }
      case "PENALIZAR_REPETICION_COMPONENTE_PRINCIPAL":
      case "PENALIZAR_REPETICION_GUARNICION":
        delta = contexto.repeticionParcial ? Number(regla.peso || -5) : 0;
        break;
      default:
        delta = 0;
    }

    if (delta >= 0) premio = delta;
    else penalizacion = Math.abs(delta);

    total += delta;
    detalles.push({
      regla_id: regla.id,
      codigo: regla.codigo,
      cumplida: delta >= 0,
      obligatoria: false,
      puntaje: Number(delta.toFixed(4)),
      puntaje_base: puntajeBase,
      premios: Number(premio.toFixed(4)),
      penalizaciones: Number(penalizacion.toFixed(4)),
      puntaje_final: Number((puntajeBase + premio - penalizacion).toFixed(4)),
      mensaje:
        delta >= 0 ? "Regla preferencial aplicada" : "Penalización aplicada",
      metricas: {
        usos_mismo_dia: Number(contexto.metricas.usos_mismo_dia || 0),
        usos_totales: Number(contexto.metricas.usos_totales || 0),
        ultima_fecha: contexto.metricas.ultima_fecha || null,
        categorias_nuevas: [...candidatoCategorias].filter(
          (id) => !categoriasUsadas.has(id),
        ).length,
        proteinas_nuevas: [...candidatoProteinas].filter(
          (id) => !proteinasUsadas.has(id),
        ).length,
        repeticiones_categoria_consecutiva: tamInterseccion(
          candidatoCategorias,
          categoriasPrevias,
        ),
        repeticiones_proteina_consecutiva: tamInterseccion(
          candidatoProteinas,
          proteinasPrevias,
        ),
      },
    });
  }

  return {
    puntaje: Number(total.toFixed(4)),
    detalles,
  };
}

export function detectarIncompatibilidadesObligatorias(reglas) {
  const codigos = new Set(reglas.map((r) => r.codigo));
  const conflictos = [];

  if (
    codigos.has("MAXIMO_CATEGORIA_SEMANA") &&
    codigos.has("MINIMO_CATEGORIA_SEMANA")
  ) {
    const max = reglas.find((r) => r.codigo === "MAXIMO_CATEGORIA_SEMANA");
    const min = reglas.find((r) => r.codigo === "MINIMO_CATEGORIA_SEMANA");
    if (
      max?.parametros?.categoria_id === min?.parametros?.categoria_id &&
      Number(max?.parametros?.cantidad || 0) <
        Number(min?.parametros?.cantidad || 0)
    ) {
      conflictos.push({
        codigo: "REGLAS_INCOMPATIBLES",
        mensaje: "Mínimo de categoría mayor al máximo para la misma categoría",
        reglaA: max.id,
        reglaB: min.id,
      });
    }
  }

  return conflictos;
}

export function evaluarViabilidadGlobalObligatorias(contexto) {
  const conflictos = [];

  for (const regla of contexto.reglasObligatorias || []) {
    if (regla.codigo === "MINIMO_CATEGORIA_SEMANA") {
      const categoriaId = String(regla.parametros?.categoria_id || "");
      const minimo = Number(regla.parametros?.cantidad || 0);
      if (!categoriaId) continue;
      const actual = Number(contexto.conteosCategorias?.get(categoriaId) || 0);
      const restantes = Number(contexto.posicionesRestantes || 0);
      if (actual + restantes < minimo) {
        conflictos.push({
          codigo: regla.codigo,
          regla_id: regla.id,
          mensaje:
            "No hay suficientes posiciones para alcanzar el mínimo de categoría",
          metricas: { categoria_id: categoriaId, actual, minimo, restantes },
        });
      }
    }

    if (regla.codigo === "MINIMO_PROTEINA_SEMANA") {
      const proteinaId = String(regla.parametros?.proteina_id || "");
      const minimo = Number(regla.parametros?.cantidad || 0);
      if (!proteinaId) continue;
      const actual = Number(contexto.conteosProteinas?.get(proteinaId) || 0);
      const restantes = Number(contexto.posicionesRestantes || 0);
      if (actual + restantes < minimo) {
        conflictos.push({
          codigo: regla.codigo,
          regla_id: regla.id,
          mensaje:
            "No hay suficientes posiciones para alcanzar el mínimo de proteína",
          metricas: { proteina_id: proteinaId, actual, minimo, restantes },
        });
      }
    }
  }

  return conflictos;
}
