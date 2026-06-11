import { fechaHoyIso } from "./propuestas.utilidades.js";

export function clasificarCandidatosBase(candidatos, fechaObjetivo, usados) {
  const hoy = fechaObjetivo || fechaHoyIso();
  const aceptados = [];
  const descartados = {
    porRegla: 0,
    porDuplicado: 0,
  };

  for (const p of candidatos) {
    if (p.eliminado_en) {
      descartados.porRegla += 1;
      continue;
    }
    if (p.estado === "ARCHIVADO" || p.estado === "INACTIVO") {
      descartados.porRegla += 1;
      continue;
    }

    if (p.estado === "BLOQUEADO_TEMPORALMENTE") {
      const desde = p.bloqueado_desde
        ? String(p.bloqueado_desde).slice(0, 10)
        : null;
      const hasta = p.bloqueado_hasta
        ? String(p.bloqueado_hasta).slice(0, 10)
        : null;
      if (!desde && !hasta) {
        descartados.porRegla += 1;
        continue;
      }
      if ((!desde || desde <= hoy) && (!hasta || hasta >= hoy)) {
        descartados.porRegla += 1;
        continue;
      }
    }

    if (usedosContiene(usados, p.id)) {
      descartados.porDuplicado += 1;
      continue;
    }

    aceptados.push(p);
  }

  return { aceptados, descartados };
}

export function filtrarCandidatosBase(candidatos, fechaObjetivo, usados) {
  return clasificarCandidatosBase(candidatos, fechaObjetivo, usados).aceptados;
}

function usedosContiene(usados, platoId) {
  if (!usados) return false;
  return usados.has(platoId);
}

export function ordenarPosicionesPorDificultad(posiciones, mapaCandidatos) {
  return [...posiciones].sort((a, b) => {
    const na = (mapaCandidatos.get(a.clave) || []).length;
    const nb = (mapaCandidatos.get(b.clave) || []).length;
    if (na !== nb) return na - nb;

    const ra = Number(a.reglasAplicables || 0);
    const rb = Number(b.reglasAplicables || 0);
    if (ra !== rb) return rb - ra;

    const ba = Number(a.cercaniaBloqueada || 0);
    const bb = Number(b.cercaniaBloqueada || 0);
    if (ba !== bb) return bb - ba;

    if (a.fecha !== b.fecha)
      return String(a.fecha).localeCompare(String(b.fecha));
    if (a.codigoOpcion !== b.codigoOpcion) {
      return String(a.codigoOpcion).localeCompare(String(b.codigoOpcion));
    }
    return a.ordenGlobal - b.ordenGlobal;
  });
}

export function ordenarCandidatosPorHeuristica(
  candidatos,
  obtenerPuntajePreliminar,
  rng,
) {
  const decorados = candidatos.map((c, idx) => ({
    candidato: c,
    puntaje: Number(obtenerPuntajePreliminar(c) || 0),
    azar: Number(rng() || 0),
    idx,
  }));

  decorados.sort((a, b) => {
    if (a.puntaje !== b.puntaje) return b.puntaje - a.puntaje;
    if (a.azar !== b.azar) return a.azar - b.azar;
    return String(a.candidato.id).localeCompare(String(b.candidato.id));
  });

  return decorados.map((d) => d.candidato);
}
