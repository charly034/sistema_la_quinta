export function construirExplicacionPlato({
  candidato,
  metricas,
  detallesReglas,
}) {
  const razones = [];

  if (metricas.semanas_desde_ultimo_uso != null) {
    razones.push(
      `no se utiliza desde hace ${metricas.semanas_desde_ultimo_uso} semanas`,
    );
  }
  if (Number(metricas.usos_mismo_dia || 0) > 0) {
    razones.push(
      `históricamente aparece ${metricas.usos_mismo_dia} veces en este día`,
    );
  }
  if (candidato.favorito) {
    razones.push("es un plato marcado como favorito");
  }

  const reglasTop = (detallesReglas || [])
    .filter((d) => !d.obligatoria && d.puntaje > 0)
    .sort((a, b) => b.puntaje - a.puntaje)
    .slice(0, 2)
    .map((d) => d.codigo.toLowerCase().replaceAll("_", " "));

  for (const r of reglasTop) {
    razones.push(`cumple preferencia ${r}`);
  }

  return {
    texto:
      razones.length > 0
        ? `Se recomienda “${candidato.nombre}” porque ${razones.join(", ")}.`
        : `Se recomienda “${candidato.nombre}” por cumplir las restricciones activas.`,
    razones,
  };
}
