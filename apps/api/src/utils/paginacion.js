export function obtenerPaginacion(query = {}) {
  const pagina = Math.max(Number(query.pagina) || 1, 1);
  const tamano = Math.min(Math.max(Number(query.tamano) || 20, 1), 100);
  const offset = (pagina - 1) * tamano;
  return { pagina, tamano, offset };
}

export function construirMetaPaginacion({ pagina, tamano, total }) {
  return {
    pagina,
    tamano,
    total,
    totalPaginas: Math.ceil(total / tamano) || 0,
  };
}
