import { CONFIG_MOTOR } from "./propuestas.constantes.js";
import {
  mezclarDeterminista,
  crearRngDeterminista,
} from "./propuestas.utilidades.js";
import {
  clasificarCandidatosBase,
  ordenarPosicionesPorDificultad,
  ordenarCandidatosPorHeuristica,
} from "./selector-candidatos.servicio.js";
import {
  evaluarObligatoriasParaCandidato,
  evaluarViabilidadGlobalObligatorias,
  puntuarPreferenciales,
} from "./evaluador-reglas.servicio.js";
import { construirExplicacionPlato } from "./explicador-propuestas.servicio.js";

function agregarConteo(mapa, ids, delta) {
  for (const id of ids || []) {
    const key = String(id);
    mapa.set(key, Number(mapa.get(key) || 0) + delta);
    if (mapa.get(key) <= 0) mapa.delete(key);
  }
}

function toSetIds(arr) {
  return new Set((arr || []).map((x) => String(x)));
}

function maximoPosibleDesde(indiceActual, cotaPorPosicion) {
  let total = 0;
  for (let i = indiceActual; i < cotaPorPosicion.length; i += 1) {
    total += Number(cotaPorPosicion[i] || 0);
  }
  return total;
}

function determinarMotivoFinalizacion({
  timeoutAlcanzado,
  limiteNodosAlcanzado,
  tieneSolucion,
  sinCandidatosGlobal,
  posicionBloqueadaConflictiva,
}) {
  if (tieneSolucion) return "COMPLETADO";
  if (posicionBloqueadaConflictiva) return "POSICION_BLOQUEADA_CONFLICTIVA";
  if (timeoutAlcanzado) return "TIMEOUT";
  if (limiteNodosAlcanzado) return "LIMITE_NODOS";
  if (sinCandidatosGlobal) return "SIN_CANDIDATOS";
  return "SIN_SOLUCION_COMPLETA";
}

function evaluarPosicionBloqueadaConflictiva({
  posiciones,
  reglasObligatorias,
  candidatosPorId,
  metricasPorPlato,
}) {
  const bloqueadas = posiciones.filter((p) => p.bloqueada && p.platoId);
  if (!bloqueadas.length) return null;

  const usosBloqueados = new Map();
  const conteosCategorias = new Map();
  const conteosProteinas = new Map();

  for (const pos of bloqueadas) {
    const platoId = String(pos.platoId);
    usosBloqueados.set(platoId, Number(usosBloqueados.get(platoId) || 0) + 1);
    const candidato = candidatosPorId.get(platoId);
    if (!candidato) continue;
    for (const categoriaId of candidato.categorias || []) {
      const key = String(categoriaId);
      conteosCategorias.set(key, Number(conteosCategorias.get(key) || 0) + 1);
    }
    for (const proteinaId of candidato.proteinas || []) {
      const key = String(proteinaId);
      conteosProteinas.set(key, Number(conteosProteinas.get(key) || 0) + 1);
    }
  }

  for (const pos of bloqueadas) {
    const platoId = String(pos.platoId);
    const candidato = candidatosPorId.get(platoId);
    if (!candidato) continue;

    for (const regla of reglasObligatorias) {
      const claveRegla = String(regla.tipo || regla.codigo || "");

      if (claveRegla === "NO_REPETIR_PLATO_EN_SEMANA") {
        const usos = Number(usosBloqueados.get(platoId) || 0);
        if (usos > 1) {
          return {
            codigo: "POSICION_BLOQUEADA_CONFLICTIVA",
            estado: "INVALIDA",
            posicion_conflictiva: {
              dia_id: pos.diaVersionMenuId,
              opcion_id: pos.opcionMenuMarcaId,
              plato_id: platoId,
            },
            regla_incumplida: {
              id: regla.id,
              codigo: regla.codigo,
            },
            mensaje:
              "La posicion bloqueada impide cumplir una regla obligatoria",
            posiciones_sin_resolver: [],
            mejor_solucion_parcial: {},
          };
        }
      }

      if (claveRegla === "MAXIMO_CATEGORIA_SEMANA") {
        const categoriaId = String(regla.parametros?.categoria_id || "");
        const maximo = Number(regla.parametros?.cantidad || 0);
        if (!categoriaId) continue;
        const actual = Number(conteosCategorias.get(categoriaId) || 0);
        if (actual > maximo) {
          return {
            codigo: "POSICION_BLOQUEADA_CONFLICTIVA",
            estado: "INVALIDA",
            posicion_conflictiva: {
              dia_id: pos.diaVersionMenuId,
              opcion_id: pos.opcionMenuMarcaId,
              plato_id: platoId,
            },
            regla_incumplida: {
              id: regla.id,
              codigo: regla.codigo,
            },
            mensaje:
              "La posicion bloqueada impide cumplir una regla obligatoria",
            posiciones_sin_resolver: [],
            mejor_solucion_parcial: {},
          };
        }
      }

      if (claveRegla === "MAXIMO_PROTEINA_SEMANA") {
        const proteinaId = String(regla.parametros?.proteina_id || "");
        const maximo = Number(regla.parametros?.cantidad || 0);
        if (!proteinaId) continue;
        const actual = Number(conteosProteinas.get(proteinaId) || 0);
        if (actual > maximo) {
          return {
            codigo: "POSICION_BLOQUEADA_CONFLICTIVA",
            estado: "INVALIDA",
            posicion_conflictiva: {
              dia_id: pos.diaVersionMenuId,
              opcion_id: pos.opcionMenuMarcaId,
              plato_id: platoId,
            },
            regla_incumplida: {
              id: regla.id,
              codigo: regla.codigo,
            },
            mensaje:
              "La posicion bloqueada impide cumplir una regla obligatoria",
            posiciones_sin_resolver: [],
            mejor_solucion_parcial: {},
          };
        }
      }

      if (
        claveRegla === "EXCLUIR_PLATOS_INACTIVOS" &&
        candidato.estado === "INACTIVO"
      ) {
        return {
          codigo: "POSICION_BLOQUEADA_CONFLICTIVA",
          estado: "INVALIDA",
          posicion_conflictiva: {
            dia_id: pos.diaVersionMenuId,
            opcion_id: pos.opcionMenuMarcaId,
            plato_id: platoId,
          },
          regla_incumplida: {
            id: regla.id,
            codigo: regla.codigo,
          },
          mensaje: "La posicion bloqueada impide cumplir una regla obligatoria",
          posiciones_sin_resolver: [],
          mejor_solucion_parcial: {},
        };
      }

      if (
        claveRegla === "EXCLUIR_PLATOS_ARCHIVADOS" &&
        candidato.estado === "ARCHIVADO"
      ) {
        return {
          codigo: "POSICION_BLOQUEADA_CONFLICTIVA",
          estado: "INVALIDA",
          posicion_conflictiva: {
            dia_id: pos.diaVersionMenuId,
            opcion_id: pos.opcionMenuMarcaId,
            plato_id: platoId,
          },
          regla_incumplida: {
            id: regla.id,
            codigo: regla.codigo,
          },
          mensaje: "La posicion bloqueada impide cumplir una regla obligatoria",
          posiciones_sin_resolver: [],
          mejor_solucion_parcial: {},
        };
      }

      // ANTIGUEDAD_MINIMA_PLATO no invalida posiciones bloqueadas:
      // solo aplica al espacio que el motor puede optimizar.
    }
  }

  return null;
}

export function generarPropuestaDeterminista({
  semilla,
  posiciones,
  candidatos,
  reglas,
  metricasPorPlato,
  maxCandidatosPorPosicion = CONFIG_MOTOR.MAX_CANDIDATOS_POR_POSICION,
  maxNodos = CONFIG_MOTOR.MAX_NODOS,
  timeoutMs = CONFIG_MOTOR.TIMEOUT_MS,
}) {
  const inicio = Date.now();
  const rng = crearRngDeterminista(semilla);
  let nodos = 0;
  let timeoutAlcanzado = false;
  let limiteNodosAlcanzado = false;
  let sinCandidatosGlobal = false;
  const podas = {
    total: 0,
    porDuplicado: 0,
    porRegla: 0,
    porCota: 0,
    porSinCandidatos: 0,
    porInviabilidadGlobal: 0,
  };

  const reglasObligatorias = reglas.filter(
    (r) => r.naturaleza === "OBLIGATORIA",
  );
  const reglasPreferenciales = reglas.filter(
    (r) => r.naturaleza === "PREFERENCIAL",
  );

  // Evita no-determinismo por orden no garantizado desde SQL.
  const candidatosOrdenBase = [...candidatos].sort((a, b) =>
    String(a.id).localeCompare(String(b.id)),
  );

  const candidatosPorId = new Map(
    candidatosOrdenBase.map((c) => [String(c.id), c]),
  );

  const usadosIniciales = new Set(
    posiciones.filter((p) => p.bloqueada && p.platoId).map((p) => p.platoId),
  );

  const conflictoBloqueada = evaluarPosicionBloqueadaConflictiva({
    posiciones,
    reglasObligatorias,
    candidatosPorId,
    metricasPorPlato,
  });

  const fechaBloqueada = new Set(
    posiciones.filter((p) => p.bloqueada).map((p) => String(p.fecha)),
  );

  const mapaCandidatos = new Map();
  const cotaBasePorClave = new Map();
  for (const p of posiciones) {
    if (p.bloqueada) {
      mapaCandidatos.set(p.clave, []);
      cotaBasePorClave.set(p.clave, 0);
      continue;
    }

    const clasificacionBase = clasificarCandidatosBase(
      candidatosOrdenBase,
      p.fecha,
      usadosIniciales,
    );
    podas.total +=
      clasificacionBase.descartados.porRegla +
      clasificacionBase.descartados.porDuplicado;
    podas.porRegla += clasificacionBase.descartados.porRegla;
    podas.porDuplicado += clasificacionBase.descartados.porDuplicado;

    const base = mezclarDeterminista(clasificacionBase.aceptados, rng);

    const candidatosOrdenados = ordenarCandidatosPorHeuristica(
      base,
      (candidato) => {
        const metricas = metricasPorPlato.get(candidato.id) || {
          usos_totales: 0,
          usos_mismo_dia: 0,
          ultima_fecha: null,
        };
        return puntuarPreferenciales({
          reglasPreferenciales,
          metricas,
          candidato,
          fechaObjetivo: p.fecha,
          repeticionParcial: false,
          categoriasUsadas: new Set(),
          proteinasUsadas: new Set(),
          categoriasPrevias: new Set(),
          proteinasPrevias: new Set(),
        }).puntaje;
      },
      rng,
    ).slice(0, maxCandidatosPorPosicion);

    mapaCandidatos.set(p.clave, candidatosOrdenados);
    cotaBasePorClave.set(
      p.clave,
      Number(
        candidatosOrdenados.length
          ? Math.max(
              ...candidatosOrdenados.map((candidato) => {
                const metricas = metricasPorPlato.get(candidato.id) || {
                  usos_totales: 0,
                  usos_mismo_dia: 0,
                  ultima_fecha: null,
                };
                return puntuarPreferenciales({
                  reglasPreferenciales,
                  metricas,
                  candidato,
                  fechaObjetivo: p.fecha,
                  repeticionParcial: false,
                  categoriasUsadas: new Set(),
                  proteinasUsadas: new Set(),
                  categoriasPrevias: new Set(),
                  proteinasPrevias: new Set(),
                }).puntaje;
              }),
            )
          : 0,
      ),
    );
  }

  const posicionesGenerables = posiciones.filter((p) => !p.bloqueada);
  if (
    posicionesGenerables.length &&
    posicionesGenerables.some(
      (p) => (mapaCandidatos.get(p.clave) || []).length === 0,
    )
  ) {
    sinCandidatosGlobal = true;
  }

  const ordenadas = ordenarPosicionesPorDificultad(
    posicionesGenerables.map((p) => ({
      ...p,
      reglasAplicables: reglasObligatorias.length + reglasPreferenciales.length,
      cercaniaBloqueada: fechaBloqueada.has(String(p.fecha)) ? 2 : 0,
    })),
    mapaCandidatos,
  );

  const cotaPorPosicion = ordenadas.map(
    (p) => cotaBasePorClave.get(p.clave) || 0,
  );

  const mejor = {
    asignaciones: null,
    puntaje: Number.NEGATIVE_INFINITY,
    evaluaciones: null,
    conflictos: [],
  };

  function construirSolucionGreedy() {
    const usados = new Set(usadosIniciales);
    const conteosCategoriasGreedy = new Map();
    const conteosProteinasGreedy = new Map();
    const categoriasUsadasGreedy = new Set();
    const proteinasUsadasGreedy = new Set();
    const consecutivoGreedy = new Map();
    const asignacionesGreedy = [];
    const evaluacionesGreedy = [];
    let puntajeGreedy = 0;

    for (const pos of ordenadas) {
      const opcionesPos = mapaCandidatos.get(pos.clave) || [];
      let mejorLocal = null;

      for (const candidato of opcionesPos) {
        if (usados.has(candidato.id)) continue;

        const metricas = metricasPorPlato.get(candidato.id) || {
          usos_totales: 0,
          usos_mismo_dia: 0,
          ultima_fecha: null,
        };
        const categoriasCandidato = toSetIds(candidato.categorias);
        const proteinasCandidato = toSetIds(candidato.proteinas);
        const previo = consecutivoGreedy.get(String(pos.opcionMenuMarcaId)) || {
          categorias: new Set(),
          proteinas: new Set(),
        };

        const obligatorias = evaluarObligatoriasParaCandidato({
          reglasObligatorias,
          platosYaAsignados: usados,
          conteosCategorias: conteosCategoriasGreedy,
          conteosProteinas: conteosProteinasGreedy,
          candidato,
          metricas,
          fechaObjetivo: pos.fecha,
        });
        if (obligatorias.some((o) => o.bloquea)) continue;

        const preferenciales = puntuarPreferenciales({
          reglasPreferenciales,
          metricas,
          candidato,
          fechaObjetivo: pos.fecha,
          repeticionParcial:
            [...categoriasCandidato].some((x) => previo.categorias.has(x)) ||
            [...proteinasCandidato].some((x) => previo.proteinas.has(x)),
          categoriasUsadas: categoriasUsadasGreedy,
          proteinasUsadas: proteinasUsadasGreedy,
          categoriasPrevias: previo.categorias,
          proteinasPrevias: previo.proteinas,
        });

        if (!mejorLocal || preferenciales.puntaje > mejorLocal.puntaje) {
          mejorLocal = {
            candidato,
            metricas,
            categoriasCandidato,
            proteinasCandidato,
            obligatorias,
            preferenciales,
          };
        }
      }

      if (!mejorLocal) return null;

      const { candidato, metricas, categoriasCandidato, proteinasCandidato } =
        mejorLocal;
      const previo = consecutivoGreedy.get(String(pos.opcionMenuMarcaId)) || {
        categorias: new Set(),
        proteinas: new Set(),
      };

      const explicacion = construirExplicacionPlato({
        candidato,
        metricas,
        detallesReglas: [
          ...mejorLocal.obligatorias,
          ...mejorLocal.preferenciales.detalles,
        ],
      });

      asignacionesGreedy.push({
        diaVersionMenuId: pos.diaVersionMenuId,
        fecha: pos.fecha,
        opcionMenuMarcaId: pos.opcionMenuMarcaId,
        codigoOpcion: pos.codigoOpcion,
        nombreOpcion: pos.nombreOpcion,
        platoId: candidato.id,
        platoNombre: candidato.nombre,
        puntaje: mejorLocal.preferenciales.puntaje,
        posicionBloqueada: false,
        seleccionadoManual: false,
        explicacion,
        metricas,
        evaluaciones: [
          ...mejorLocal.obligatorias,
          ...mejorLocal.preferenciales.detalles,
        ],
        orden: pos.orden,
      });

      puntajeGreedy += mejorLocal.preferenciales.puntaje;
      evaluacionesGreedy.push(
        ...mejorLocal.obligatorias,
        ...mejorLocal.preferenciales.detalles,
      );

      usados.add(candidato.id);
      agregarConteo(conteosCategoriasGreedy, categoriasCandidato, 1);
      agregarConteo(conteosProteinasGreedy, proteinasCandidato, 1);
      for (const categoria of categoriasCandidato)
        categoriasUsadasGreedy.add(categoria);
      for (const proteina of proteinasCandidato)
        proteinasUsadasGreedy.add(proteina);
      consecutivoGreedy.set(String(pos.opcionMenuMarcaId), {
        categorias: categoriasCandidato,
        proteinas: proteinasCandidato,
      });
      if (!previo) consecutivoGreedy.delete(String(pos.opcionMenuMarcaId));
    }

    // Valida mínimos globales al finalizar: una solución greedy completa puede ser inviable.
    const conflictosGlobalesGreedy = evaluarViabilidadGlobalObligatorias({
      reglasObligatorias,
      conteosCategorias: conteosCategoriasGreedy,
      conteosProteinas: conteosProteinasGreedy,
      posicionesRestantes: 0,
    });
    if (conflictosGlobalesGreedy.length) return null;

    return {
      asignaciones: asignacionesGreedy,
      puntaje: puntajeGreedy,
      evaluaciones: evaluacionesGreedy,
    };
  }

  const baselineGreedy = construirSolucionGreedy();
  if (baselineGreedy) {
    mejor.asignaciones = baselineGreedy.asignaciones;
    mejor.puntaje = baselineGreedy.puntaje;
    mejor.evaluaciones = baselineGreedy.evaluaciones;
  }

  const conteosCategorias = new Map();
  const conteosProteinas = new Map();
  const categoriasUsadas = new Set();
  const proteinasUsadas = new Set();
  const consecutivoPorOpcion = new Map();

  function backtrack(
    idx,
    asignaciones,
    usados,
    puntajeAcumulado,
    evaluacionesAcumuladas,
  ) {
    if (Date.now() - inicio > timeoutMs) {
      timeoutAlcanzado = true;
      mejor.conflictos.push({
        codigo: "TIEMPO_MOTOR_AGOTADO",
        mensaje: "Se agotó el tiempo del motor",
      });
      return;
    }
    if (nodos >= maxNodos) {
      limiteNodosAlcanzado = true;
      mejor.conflictos.push({
        codigo: "LIMITE_MOTOR_ALCANZADO",
        mensaje: "Se alcanzó el límite de nodos",
      });
      return;
    }

    nodos += 1;

    if (idx >= ordenadas.length) {
      const conflictosGlobalesFinal = evaluarViabilidadGlobalObligatorias({
        reglasObligatorias,
        conteosCategorias,
        conteosProteinas,
        posicionesRestantes: 0,
      });
      if (conflictosGlobalesFinal.length) {
        podas.total += 1;
        podas.porInviabilidadGlobal += 1;
        mejor.conflictos.push(...conflictosGlobalesFinal);
        return;
      }

      if (puntajeAcumulado > mejor.puntaje) {
        mejor.asignaciones = [...asignaciones];
        mejor.puntaje = puntajeAcumulado;
        mejor.evaluaciones = [...evaluacionesAcumuladas];
      }
      return;
    }

    const pos = ordenadas[idx];
    const opciones = mapaCandidatos.get(pos.clave) || [];
    if (!opciones.length) {
      podas.total += 1;
      podas.porSinCandidatos += 1;
      return;
    }

    const conflictosGlobales = evaluarViabilidadGlobalObligatorias({
      reglasObligatorias,
      conteosCategorias,
      conteosProteinas,
      posicionesRestantes: ordenadas.length - idx,
    });
    if (conflictosGlobales.length) {
      podas.total += 1;
      podas.porInviabilidadGlobal += 1;
      mejor.conflictos.push(...conflictosGlobales);
      return;
    }

    const cotaPosible =
      puntajeAcumulado + maximoPosibleDesde(idx, cotaPorPosicion);
    if (mejor.asignaciones && cotaPosible <= mejor.puntaje) {
      podas.total += 1;
      podas.porCota += 1;
      return;
    }

    for (const candidato of opciones) {
      if (usados.has(candidato.id)) {
        podas.total += 1;
        podas.porDuplicado += 1;
        continue;
      }

      if (mejor.asignaciones) {
        const cotaCandidato = puntuarPreferenciales({
          reglasPreferenciales,
          metricas: metricasPorPlato.get(candidato.id) || {
            usos_totales: 0,
            usos_mismo_dia: 0,
            ultima_fecha: null,
          },
          candidato,
          fechaObjetivo: pos.fecha,
          repeticionParcial: false,
          categoriasUsadas: new Set(),
          proteinasUsadas: new Set(),
          categoriasPrevias: new Set(),
          proteinasPrevias: new Set(),
        }).puntaje;

        const maximoRestante = maximoPosibleDesde(idx + 1, cotaPorPosicion);
        const cotaPosibleConCandidato =
          puntajeAcumulado + cotaCandidato + maximoRestante;

        if (cotaPosibleConCandidato <= mejor.puntaje) {
          podas.total += 1;
          podas.porCota += 1;
          continue;
        }
      }

      const metricas = metricasPorPlato.get(candidato.id) || {
        usos_totales: 0,
        usos_mismo_dia: 0,
        ultima_fecha: null,
      };

      const categoriasCandidato = toSetIds(candidato.categorias);
      const proteinasCandidato = toSetIds(candidato.proteinas);
      const previo = consecutivoPorOpcion.get(
        String(pos.opcionMenuMarcaId),
      ) || {
        categorias: new Set(),
        proteinas: new Set(),
      };

      const obligatorias = evaluarObligatoriasParaCandidato({
        reglasObligatorias,
        platosYaAsignados: usados,
        conteosCategorias,
        conteosProteinas,
        candidato,
        metricas,
        fechaObjetivo: pos.fecha,
      });

      if (obligatorias.some((o) => o.bloquea)) {
        podas.total += 1;
        podas.porRegla += 1;
        continue;
      }

      const preferenciales = puntuarPreferenciales({
        reglasPreferenciales,
        metricas,
        candidato,
        fechaObjetivo: pos.fecha,
        repeticionParcial:
          [...categoriasCandidato].some((x) => previo.categorias.has(x)) ||
          [...proteinasCandidato].some((x) => previo.proteinas.has(x)),
        categoriasUsadas,
        proteinasUsadas,
        categoriasPrevias: previo.categorias,
        proteinasPrevias: previo.proteinas,
      });

      const explicacion = construirExplicacionPlato({
        candidato,
        metricas: {
          ...metricas,
          semanas_desde_ultimo_uso:
            obligatorias.find((o) => o.codigo === "ANTIGUEDAD_MINIMA_PLATO")
              ?.metricas?.semanas_desde_ultimo_uso ?? null,
        },
        detallesReglas: [...obligatorias, ...preferenciales.detalles],
      });

      const evalPos = {
        diaVersionMenuId: pos.diaVersionMenuId,
        fecha: pos.fecha,
        opcionMenuMarcaId: pos.opcionMenuMarcaId,
        codigoOpcion: pos.codigoOpcion,
        nombreOpcion: pos.nombreOpcion,
        platoId: candidato.id,
        platoNombre: candidato.nombre,
        puntaje: preferenciales.puntaje,
        posicionBloqueada: false,
        seleccionadoManual: false,
        explicacion,
        metricas,
        evaluaciones: [...obligatorias, ...preferenciales.detalles],
        orden: pos.orden,
      };

      usados.add(candidato.id);
      agregarConteo(conteosCategorias, categoriasCandidato, 1);
      agregarConteo(conteosProteinas, proteinasCandidato, 1);
      const categoriasNuevas = [...categoriasCandidato].filter(
        (x) => !categoriasUsadas.has(x),
      );
      const proteinasNuevas = [...proteinasCandidato].filter(
        (x) => !proteinasUsadas.has(x),
      );
      for (const categoria of categoriasNuevas) categoriasUsadas.add(categoria);
      for (const proteina of proteinasNuevas) proteinasUsadas.add(proteina);
      const previoOpcion = consecutivoPorOpcion.get(
        String(pos.opcionMenuMarcaId),
      );
      consecutivoPorOpcion.set(String(pos.opcionMenuMarcaId), {
        categorias: categoriasCandidato,
        proteinas: proteinasCandidato,
      });

      asignaciones.push(evalPos);
      evaluacionesAcumuladas.push(...obligatorias, ...preferenciales.detalles);

      backtrack(
        idx + 1,
        asignaciones,
        usados,
        puntajeAcumulado + preferenciales.puntaje,
        evaluacionesAcumuladas,
      );

      evaluacionesAcumuladas.splice(
        evaluacionesAcumuladas.length -
          (obligatorias.length + preferenciales.detalles.length),
        obligatorias.length + preferenciales.detalles.length,
      );
      asignaciones.pop();
      agregarConteo(conteosCategorias, categoriasCandidato, -1);
      agregarConteo(conteosProteinas, proteinasCandidato, -1);
      for (const categoria of categoriasNuevas)
        categoriasUsadas.delete(categoria);
      for (const proteina of proteinasNuevas) proteinasUsadas.delete(proteina);
      if (previoOpcion) {
        consecutivoPorOpcion.set(String(pos.opcionMenuMarcaId), previoOpcion);
      } else {
        consecutivoPorOpcion.delete(String(pos.opcionMenuMarcaId));
      }
      usados.delete(candidato.id);
    }
  }

  backtrack(0, [], new Set(usadosIniciales), 0, []);

  const bloqueadas = posiciones
    .filter((p) => p.bloqueada)
    .map((p) => ({
      diaVersionMenuId: p.diaVersionMenuId,
      fecha: p.fecha,
      opcionMenuMarcaId: p.opcionMenuMarcaId,
      codigoOpcion: p.codigoOpcion,
      nombreOpcion: p.nombreOpcion,
      platoId: p.platoId,
      platoNombre: p.platoNombre,
      puntaje: 0,
      posicionBloqueada: true,
      seleccionadoManual: true,
      explicacion: {
        texto: "Posición bloqueada manualmente",
        razones: ["bloqueado_manual"],
      },
      metricas: {},
      evaluaciones: [],
      orden: p.orden,
    }));

  const salida = [...bloqueadas, ...(mejor.asignaciones || [])].sort((a, b) => {
    if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha);
    return a.orden - b.orden;
  });

  const posicionesConCandidatos = [...mapaCandidatos.values()].filter(
    (arr) => arr.length > 0,
  );
  const candidatosTotales = posicionesConCandidatos.reduce(
    (acc, arr) => acc + arr.length,
    0,
  );
  const promedioCandidatosPorPosicion = posicionesConCandidatos.length
    ? candidatosTotales / posicionesConCandidatos.length
    : 0;

  const hayConflictoBloqueada = Boolean(conflictoBloqueada);
  const tieneSolucionCompleta =
    Boolean(mejor.asignaciones) && !hayConflictoBloqueada;

  return {
    estado: tieneSolucionCompleta ? "GENERADA" : "INVALIDA",
    puntajeTotal: Number(
      (mejor.puntaje === Number.NEGATIVE_INFINITY ? 0 : mejor.puntaje).toFixed(
        4,
      ),
    ),
    detalle: salida,
    reglasIncumplidas: conflictoBloqueada
      ? [conflictoBloqueada, ...mejor.conflictos]
      : mejor.conflictos,
    resumen: {
      candidatosTotales,
      promedioCandidatosPorPosicion: Number(
        promedioCandidatosPorPosicion.toFixed(4),
      ),
      candidatosEvaluados: [...mapaCandidatos.values()].reduce(
        (a, b) => a + b.length,
        0,
      ),
      nodosExplorados: nodos,
      ramasPodadas: podas.total,
      ramasPodadasTotal: podas.total,
      ramasPodadasPorDuplicado: podas.porDuplicado,
      ramasPodadasPorRegla: podas.porRegla,
      ramasPodadasPorCota: podas.porCota,
      ramasPodadasPorSinCandidatos: podas.porSinCandidatos,
      ramasPodadasPorInviabilidadGlobal: podas.porInviabilidadGlobal,
      tiempoMs: Date.now() - inicio,
      motivoFinalizacion: determinarMotivoFinalizacion({
        timeoutAlcanzado,
        limiteNodosAlcanzado,
        tieneSolucion: tieneSolucionCompleta,
        sinCandidatosGlobal,
        posicionBloqueadaConflictiva: hayConflictoBloqueada,
      }),
    },
    evaluaciones: mejor.evaluaciones || [],
    posicion_conflictiva: conflictoBloqueada?.posicion_conflictiva || null,
    regla_incumplida: conflictoBloqueada?.regla_incumplida || null,
    mensaje: conflictoBloqueada?.mensaje || null,
    posiciones_sin_resolver: conflictoBloqueada?.posiciones_sin_resolver || [],
    mejor_solucion_parcial: conflictoBloqueada?.mejor_solucion_parcial || {},
  };
}
