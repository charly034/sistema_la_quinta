import { generarPropuestaDeterminista } from "./motor-propuestas.servicio.js";

describe("motor-propuestas.servicio", () => {
  const reglasBase = [
    {
      id: "r1",
      codigo: "NO_REPETIR_PLATO_EN_SEMANA",
      naturaleza: "OBLIGATORIA",
      peso: 0,
      prioridad: 100,
      parametros: {},
    },
    {
      id: "r2",
      codigo: "PRIORIZAR_FAVORITOS",
      naturaleza: "PREFERENCIAL",
      peso: 12,
      prioridad: 10,
      parametros: {},
    },
  ];

  const candidatos = [
    { id: "p1", nombre: "Milanesa", estado: "ACTIVO", favorito: true },
    { id: "p2", nombre: "Tarta", estado: "ACTIVO", favorito: false },
  ];

  const metricasPorPlato = new Map([
    ["p1", { usos_totales: 2, usos_mismo_dia: 1, ultima_fecha: null }],
    ["p2", { usos_totales: 1, usos_mismo_dia: 0, ultima_fecha: null }],
  ]);

  it("genera resultados deterministas con misma semilla", () => {
    const posiciones = [
      {
        clave: "d1::o1",
        diaVersionMenuId: "d1",
        fecha: "2025-01-06",
        opcionMenuMarcaId: "o1",
        codigoOpcion: "A",
        nombreOpcion: "Principal",
        platoId: null,
        bloqueada: false,
        orden: 1,
        ordenGlobal: 1,
      },
    ];

    const a = generarPropuestaDeterminista({
      semilla: "seed-1",
      posiciones,
      candidatos,
      reglas: reglasBase,
      metricasPorPlato,
      maxCandidatosPorPosicion: 2,
      maxNodos: 100,
      timeoutMs: 1000,
    });

    const b = generarPropuestaDeterminista({
      semilla: "seed-1",
      posiciones,
      candidatos,
      reglas: reglasBase,
      metricasPorPlato,
      maxCandidatosPorPosicion: 2,
      maxNodos: 100,
      timeoutMs: 1000,
    });

    expect(a.estado).toBe("GENERADA");
    expect(b.estado).toBe("GENERADA");
    expect(a.detalle).toEqual(b.detalle);
    expect(a.puntajeTotal).toBe(b.puntajeTotal);
    expect(a.resumen.motivoFinalizacion).toBe("COMPLETADO");
    expect(a.resumen.ramasPodadasTotal).toBeGreaterThanOrEqual(0);
    expect(a.resumen.ramasPodadasPorRegla).toBeGreaterThanOrEqual(0);
    expect(a.resumen.ramasPodadasPorCota).toBeGreaterThanOrEqual(0);
  });

  it("preserva posiciones bloqueadas manualmente", () => {
    const posiciones = [
      {
        clave: "d1::o1",
        diaVersionMenuId: "d1",
        fecha: "2025-01-06",
        opcionMenuMarcaId: "o1",
        codigoOpcion: "A",
        nombreOpcion: "Principal",
        platoId: "p2",
        platoNombre: "Tarta",
        bloqueada: true,
        orden: 1,
        ordenGlobal: 1,
      },
    ];

    const out = generarPropuestaDeterminista({
      semilla: "seed-2",
      posiciones,
      candidatos,
      reglas: reglasBase,
      metricasPorPlato,
      maxCandidatosPorPosicion: 2,
      maxNodos: 100,
      timeoutMs: 1000,
    });

    expect(out.estado).toBe("GENERADA");
    expect(out.detalle[0].posicionBloqueada).toBe(true);
    expect(out.detalle[0].platoId).toBe("p2");
  });

  it("marca propuesta invalida sin solución", () => {
    const posiciones = [
      {
        clave: "d1::o1",
        diaVersionMenuId: "d1",
        fecha: "2025-01-06",
        opcionMenuMarcaId: "o1",
        codigoOpcion: "A",
        nombreOpcion: "Principal",
        platoId: null,
        bloqueada: false,
        orden: 1,
        ordenGlobal: 1,
      },
      {
        clave: "d2::o1",
        diaVersionMenuId: "d2",
        fecha: "2025-01-07",
        opcionMenuMarcaId: "o1",
        codigoOpcion: "A",
        nombreOpcion: "Principal",
        platoId: null,
        bloqueada: false,
        orden: 1,
        ordenGlobal: 2,
      },
    ];

    const out = generarPropuestaDeterminista({
      semilla: "seed-3",
      posiciones,
      candidatos: [
        { id: "p1", nombre: "Milanesa", estado: "ACTIVO", favorito: true },
      ],
      reglas: reglasBase,
      metricasPorPlato: new Map([
        ["p1", { usos_totales: 0, usos_mismo_dia: 0, ultima_fecha: null }],
      ]),
      maxCandidatosPorPosicion: 1,
      maxNodos: 100,
      timeoutMs: 1000,
    });

    expect(out.estado).toBe("INVALIDA");
    expect(out.resumen.motivoFinalizacion).toBe("SIN_SOLUCION_COMPLETA");
  });

  it("se detiene por limite de nodos con motivo explicito", () => {
    // 2 posiciones con 1 solo candidato: el greedy asigna p1 a d1 pero falla en d2
    // (p1 ya está usado, no hay más). Greedy retorna null → mejor.asignaciones = null.
    // Backtracking empieza pero maxNodos=0 → limiteNodosAlcanzado antes de hallar solución.
    const posiciones = [
      {
        clave: "d1::o1",
        diaVersionMenuId: "d1",
        fecha: "2025-01-06",
        opcionMenuMarcaId: "o1",
        codigoOpcion: "A",
        nombreOpcion: "Principal",
        platoId: null,
        bloqueada: false,
        orden: 1,
        ordenGlobal: 1,
      },
      {
        clave: "d2::o1",
        diaVersionMenuId: "d2",
        fecha: "2025-01-07",
        opcionMenuMarcaId: "o1",
        codigoOpcion: "A",
        nombreOpcion: "Principal",
        platoId: null,
        bloqueada: false,
        orden: 1,
        ordenGlobal: 2,
      },
    ];

    const out = generarPropuestaDeterminista({
      semilla: "seed-limit",
      posiciones,
      candidatos: [
        { id: "p1", nombre: "Unico", estado: "ACTIVO", favorito: false },
      ],
      reglas: reglasBase,
      metricasPorPlato: new Map([
        ["p1", { usos_totales: 0, usos_mismo_dia: 0, ultima_fecha: null }],
      ]),
      maxCandidatosPorPosicion: 1,
      maxNodos: 0,
      timeoutMs: 1000,
    });

    expect(out.estado).toBe("INVALIDA");
    expect(out.resumen.motivoFinalizacion).toBe("LIMITE_NODOS");
  });

  it("se detiene por timeout con motivo explicito", () => {
    // Igual que LIMITE_NODOS: greedy falla porque solo hay 1 candidato para 2 posiciones.
    // Con timeoutMs=-1 el backtracking detecta timeout antes de encontrar solución.
    const posiciones = [
      {
        clave: "d1::o1",
        diaVersionMenuId: "d1",
        fecha: "2025-01-06",
        opcionMenuMarcaId: "o1",
        codigoOpcion: "A",
        nombreOpcion: "Principal",
        platoId: null,
        bloqueada: false,
        orden: 1,
        ordenGlobal: 1,
      },
      {
        clave: "d2::o1",
        diaVersionMenuId: "d2",
        fecha: "2025-01-07",
        opcionMenuMarcaId: "o1",
        codigoOpcion: "A",
        nombreOpcion: "Principal",
        platoId: null,
        bloqueada: false,
        orden: 1,
        ordenGlobal: 2,
      },
    ];

    const out = generarPropuestaDeterminista({
      semilla: "seed-timeout",
      posiciones,
      candidatos: [
        { id: "p1", nombre: "Unico", estado: "ACTIVO", favorito: false },
      ],
      reglas: reglasBase,
      metricasPorPlato: new Map([
        ["p1", { usos_totales: 0, usos_mismo_dia: 0, ultima_fecha: null }],
      ]),
      maxCandidatosPorPosicion: 1,
      maxNodos: 100,
      timeoutMs: -1,
    });

    expect(out.estado).toBe("INVALIDA");
    expect(out.resumen.motivoFinalizacion).toBe("TIMEOUT");
  });

  it("marca posicion bloqueada conflictiva cuando viola maxima obligatoria", () => {
    const posiciones = [
      {
        clave: "d1::o1",
        diaVersionMenuId: "d1",
        fecha: "2025-01-06",
        opcionMenuMarcaId: "o1",
        codigoOpcion: "A",
        nombreOpcion: "Principal",
        platoId: "p1",
        platoNombre: "Milanesa",
        bloqueada: true,
        orden: 1,
        ordenGlobal: 1,
      },
      {
        clave: "d2::o1",
        diaVersionMenuId: "d2",
        fecha: "2025-01-07",
        opcionMenuMarcaId: "o1",
        codigoOpcion: "A",
        nombreOpcion: "Principal",
        platoId: null,
        bloqueada: false,
        orden: 1,
        ordenGlobal: 2,
      },
    ];

    const out = generarPropuestaDeterminista({
      semilla: "seed-bloqueada",
      posiciones,
      candidatos: [
        {
          id: "p1",
          nombre: "Milanesa",
          estado: "ACTIVO",
          favorito: true,
          categorias: ["cat-1"],
          proteinas: ["pro-1"],
        },
      ],
      reglas: [
        ...reglasBase,
        {
          id: "r-max-pro",
          codigo: "MAXIMO_PROTEINA_SEMANA",
          naturaleza: "OBLIGATORIA",
          peso: 0,
          prioridad: 90,
          parametros: { proteina_id: "pro-1", cantidad: 0 },
        },
      ],
      metricasPorPlato: new Map([
        ["p1", { usos_totales: 0, usos_mismo_dia: 0, ultima_fecha: null }],
      ]),
      maxCandidatosPorPosicion: 1,
      maxNodos: 100,
      timeoutMs: 1000,
    });

    expect(out.estado).toBe("INVALIDA");
    expect(out.resumen.motivoFinalizacion).toBe(
      "POSICION_BLOQUEADA_CONFLICTIVA",
    );
    expect(out.posicion_conflictiva).toEqual({
      dia_id: "d1",
      opcion_id: "o1",
      plato_id: "p1",
    });
    expect(out.regla_incumplida?.codigo).toBe("MAXIMO_PROTEINA_SEMANA");
  });

  // ---------------------------------------------------------------------------
  // PRUEBAS ESPECÍFICAS DE PODAS REALES
  // ---------------------------------------------------------------------------

  it("poda por duplicado: candidato ya asignado en otra posición del mismo backtrack", () => {
    // Dos posiciones, un solo candidato → la segunda posición no puede asignarlo,
    // el backtracking descarta esa rama por duplicado.
    const posiciones = [
      {
        clave: "d1::o1",
        diaVersionMenuId: "d1",
        fecha: "2025-01-06",
        opcionMenuMarcaId: "o1",
        codigoOpcion: "A",
        nombreOpcion: "Principal",
        platoId: null,
        bloqueada: false,
        orden: 1,
        ordenGlobal: 1,
      },
      {
        clave: "d2::o1",
        diaVersionMenuId: "d2",
        fecha: "2025-01-07",
        opcionMenuMarcaId: "o1",
        codigoOpcion: "A",
        nombreOpcion: "Principal",
        platoId: null,
        bloqueada: false,
        orden: 1,
        ordenGlobal: 2,
      },
    ];

    const out = generarPropuestaDeterminista({
      semilla: "seed-dup",
      posiciones,
      // Dos candidatos: p1 y p2. La regla NO_REPETIR_PLATO_EN_SEMANA provoca
      // que cuando p1 ya está asignado en d1, intentar p1 en d2 sea poda por duplicado.
      candidatos: [
        { id: "p1", nombre: "Plato 1", estado: "ACTIVO", favorito: true },
        { id: "p2", nombre: "Plato 2", estado: "ACTIVO", favorito: false },
      ],
      reglas: reglasBase,
      metricasPorPlato: new Map([
        ["p1", { usos_totales: 0, usos_mismo_dia: 0, ultima_fecha: null }],
        ["p2", { usos_totales: 0, usos_mismo_dia: 0, ultima_fecha: null }],
      ]),
      maxCandidatosPorPosicion: 2,
      maxNodos: 1000,
      timeoutMs: 5000,
    });

    expect(out.estado).toBe("GENERADA");
    // Con dos posiciones y dos candidatos distintos, necesariamente hay al menos
    // una rama donde se intenta reusar el mismo plato → poda por duplicado.
    expect(out.resumen.ramasPodadasPorDuplicado).toBeGreaterThanOrEqual(1);
    // La suma de componentes iguala el total reportado.
    expect(out.resumen.ramasPodadasTotal).toBe(
      out.resumen.ramasPodadasPorDuplicado +
        out.resumen.ramasPodadasPorRegla +
        out.resumen.ramasPodadasPorCota +
        out.resumen.ramasPodadasPorSinCandidatos +
        out.resumen.ramasPodadasPorInviabilidadGlobal,
    );
  });

  it("poda por regla: candidato viola una regla obligatoria de categoría", () => {
    // Escenario: p1 es favorito (puntaje alto) pero su categoría cat-A está vetada.
    // El greedy lo intenta primero, ve que MAXIMO_CATEGORIA_SEMANA lo bloquea,
    // luego asigna p2 (permitido). Cuando el backtracking intenta p1 desde la raíz,
    // la cota de p1 (puntaje alto) supera la solución greedy con p2 (puntaje 0),
    // así que no hay poda por cota; la regla obligatoria lo descarta → poda por regla.
    const posiciones = [
      {
        clave: "d1::o1",
        diaVersionMenuId: "d1",
        fecha: "2025-01-06",
        opcionMenuMarcaId: "o1",
        codigoOpcion: "A",
        nombreOpcion: "Principal",
        platoId: null,
        bloqueada: false,
        orden: 1,
        ordenGlobal: 1,
      },
    ];

    const out = generarPropuestaDeterminista({
      semilla: "seed-regla",
      posiciones,
      candidatos: [
        {
          id: "p1",
          nombre: "Vedado",
          estado: "ACTIVO",
          favorito: true, // puntaje alto → supera cota de p2; descartado por regla
          categorias: ["cat-A"],
          proteinas: [],
        },
        {
          id: "p2",
          nombre: "Permitido",
          estado: "ACTIVO",
          favorito: false,
          categorias: ["cat-B"],
          proteinas: [],
        },
      ],
      reglas: [
        ...reglasBase,
        {
          id: "r-cat",
          codigo: "MAXIMO_CATEGORIA_SEMANA",
          naturaleza: "OBLIGATORIA",
          peso: 0,
          prioridad: 90,
          parametros: { categoria_id: "cat-A", cantidad: 0 },
        },
      ],
      metricasPorPlato: new Map([
        ["p1", { usos_totales: 0, usos_mismo_dia: 0, ultima_fecha: null }],
        ["p2", { usos_totales: 0, usos_mismo_dia: 0, ultima_fecha: null }],
      ]),
      maxCandidatosPorPosicion: 2,
      maxNodos: 1000,
      timeoutMs: 5000,
    });

    // p2 (permitido) debería ser elegido; p1 bloqueado por regla.
    expect(out.estado).toBe("GENERADA");
    expect(out.detalle[0].platoId).toBe("p2");
    expect(out.resumen.ramasPodadasPorRegla).toBeGreaterThanOrEqual(1);
    expect(out.resumen.ramasPodadasTotal).toBe(
      out.resumen.ramasPodadasPorDuplicado +
        out.resumen.ramasPodadasPorRegla +
        out.resumen.ramasPodadasPorCota +
        out.resumen.ramasPodadasPorSinCandidatos +
        out.resumen.ramasPodadasPorInviabilidadGlobal,
    );
  });

  it("poda por cota real: rama cuyo puntaje máximo posible no supera la mejor solución conocida", () => {
    // Escenario de poda por cota real:
    // - Dos posiciones generables.
    // - Un candidato favorito (puntaje alto, p1) y uno no favorito (puntaje bajo, p2).
    // - La regla preferencial PRIORIZAR_FAVORITOS puntúa fuerte a p1.
    // - Después de explorar la rama p1→p1_pos2 (imposible por NO_REPETIR) e p1→p2 (solución completa),
    //   el backtrack intenta la rama empezando por p2 en pos1.
    //   Como el puntaje máximo de p2 en pos1 + p1 en pos2 ≤ puntaje ya encontrado
    //   (p1 en pos1 + p2 en pos2), esa rama es podada por cota.
    //
    // Para garantizarlo usamos pesos altos en PRIORIZAR_FAVORITOS y un solo candidato
    // con peso fuerte en la posición más difícil.

    const posiciones = [
      {
        clave: "d1::o1",
        diaVersionMenuId: "d1",
        fecha: "2025-01-06",
        opcionMenuMarcaId: "o1",
        codigoOpcion: "A",
        nombreOpcion: "Principal",
        platoId: null,
        bloqueada: false,
        orden: 1,
        ordenGlobal: 1,
      },
      {
        clave: "d2::o1",
        diaVersionMenuId: "d2",
        fecha: "2025-01-07",
        opcionMenuMarcaId: "o1",
        codigoOpcion: "A",
        nombreOpcion: "Principal",
        platoId: null,
        bloqueada: false,
        orden: 1,
        ordenGlobal: 2,
      },
    ];

    // Peso alto para que la diferencia de puntaje entre el candidato favorito
    // y el no favorito sea grande, forzando la poda por cota en la segunda rama.
    const reglasFav = [
      {
        id: "r1",
        codigo: "NO_REPETIR_PLATO_EN_SEMANA",
        naturaleza: "OBLIGATORIA",
        peso: 0,
        prioridad: 100,
        parametros: {},
      },
      {
        id: "r2",
        codigo: "PRIORIZAR_FAVORITOS",
        naturaleza: "PREFERENCIAL",
        peso: 100,
        prioridad: 10,
        parametros: {},
      },
    ];

    const out = generarPropuestaDeterminista({
      semilla: "seed-cota",
      posiciones,
      candidatos: [
        { id: "p1", nombre: "Favorito", estado: "ACTIVO", favorito: true },
        { id: "p2", nombre: "Normal", estado: "ACTIVO", favorito: false },
      ],
      reglas: reglasFav,
      metricasPorPlato: new Map([
        ["p1", { usos_totales: 0, usos_mismo_dia: 0, ultima_fecha: null }],
        ["p2", { usos_totales: 0, usos_mismo_dia: 0, ultima_fecha: null }],
      ]),
      maxCandidatosPorPosicion: 2,
      maxNodos: 1000,
      timeoutMs: 5000,
    });

    expect(out.estado).toBe("GENERADA");
    // La rama que comienza asignando p2 a d1 tiene puntaje máximo posible ≤
    // al ya obtenido (p1 en d1, p2 en d2) → poda por cota real.
    expect(out.resumen.ramasPodadasPorCota).toBeGreaterThanOrEqual(1);
    expect(out.resumen.ramasPodadasTotal).toBe(
      out.resumen.ramasPodadasPorDuplicado +
        out.resumen.ramasPodadasPorRegla +
        out.resumen.ramasPodadasPorCota +
        out.resumen.ramasPodadasPorSinCandidatos +
        out.resumen.ramasPodadasPorInviabilidadGlobal,
    );
  });

  it("poda por inviabilidad global: mínimo obligatorio imposible con posiciones restantes", () => {
    // Dos posiciones y ningún candidato pertenece a cat-Z.
    // La regla MINIMO_CATEGORIA_SEMANA exige al menos 1 de cat-Z.
    // Al llegar al final del árbol (restantes = 0, actual = 0),
    // el evaluador global detecta imposibilidad real y poda por inviabilidad.
    const posiciones = [
      {
        clave: "d1::o1",
        diaVersionMenuId: "d1",
        fecha: "2025-01-06",
        opcionMenuMarcaId: "o1",
        codigoOpcion: "A",
        nombreOpcion: "Principal",
        platoId: null,
        bloqueada: false,
        orden: 1,
        ordenGlobal: 1,
      },
      {
        clave: "d2::o1",
        diaVersionMenuId: "d2",
        fecha: "2025-01-07",
        opcionMenuMarcaId: "o1",
        codigoOpcion: "A",
        nombreOpcion: "Principal",
        platoId: null,
        bloqueada: false,
        orden: 1,
        ordenGlobal: 2,
      },
    ];

    const out = generarPropuestaDeterminista({
      semilla: "seed-inviabilidad",
      posiciones,
      candidatos: [
        {
          id: "p1",
          nombre: "CatX 1",
          estado: "ACTIVO",
          favorito: true,
          categorias: ["cat-X"],
          proteinas: [],
        },
        {
          id: "p2",
          nombre: "CatY 1",
          estado: "ACTIVO",
          favorito: false,
          categorias: ["cat-Y"],
          proteinas: [],
        },
      ],
      reglas: [
        {
          id: "r1",
          codigo: "NO_REPETIR_PLATO_EN_SEMANA",
          naturaleza: "OBLIGATORIA",
          peso: 0,
          prioridad: 100,
          parametros: {},
        },
        {
          id: "r-min-cat-z",
          codigo: "MINIMO_CATEGORIA_SEMANA",
          naturaleza: "OBLIGATORIA",
          peso: 0,
          prioridad: 90,
          parametros: { categoria_id: "cat-Z", cantidad: 1 },
        },
      ],
      metricasPorPlato: new Map([
        ["p1", { usos_totales: 0, usos_mismo_dia: 0, ultima_fecha: null }],
        ["p2", { usos_totales: 0, usos_mismo_dia: 0, ultima_fecha: null }],
      ]),
      maxCandidatosPorPosicion: 2,
      maxNodos: 1000,
      timeoutMs: 5000,
    });

    // Como no existe ningún candidato de cat-Z, el mínimo obligatorio
    // se vuelve imposible y el motor termina inválido.
    expect(out.estado).toBe("INVALIDA");
    expect(
      out.resumen.ramasPodadasPorInviabilidadGlobal,
    ).toBeGreaterThanOrEqual(1);
    expect(out.resumen.ramasPodadasTotal).toBe(
      out.resumen.ramasPodadasPorDuplicado +
        out.resumen.ramasPodadasPorRegla +
        out.resumen.ramasPodadasPorCota +
        out.resumen.ramasPodadasPorSinCandidatos +
        out.resumen.ramasPodadasPorInviabilidadGlobal,
    );
  });
});
