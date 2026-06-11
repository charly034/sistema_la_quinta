import {
  detectarIncompatibilidadesObligatorias,
  evaluarObligatoriasParaCandidato,
  evaluarViabilidadGlobalObligatorias,
  puntuarPreferenciales,
} from "./evaluador-reglas.servicio.js";

describe("Etapa 4D - matriz reglas obligatorias y preferenciales", () => {
  const candidatoBase = {
    id: "p-1",
    estado: "ACTIVO",
    favorito: false,
    categorias: ["cat-1"],
    proteinas: ["pro-1"],
    es_estacional: false,
    temporada_desde: null,
    temporada_hasta: null,
    bloqueado_desde: null,
    bloqueado_hasta: null,
  };

  test.each([
    ["NO_REPETIR_PLATO_EN_SEMANA", {}, true, true],
    ["ANTIGUEDAD_MINIMA_PLATO", { semanas_minimas: 2 }, false, true],
    ["EXCLUIR_PLATOS_INACTIVOS", {}, false, true],
    ["EXCLUIR_PLATOS_ARCHIVADOS", {}, false, true],
    ["EXCLUIR_PLATOS_BLOQUEADOS", {}, false, true],
    ["RESPETAR_TEMPORADA", {}, false, true],
    [
      "MAXIMO_CATEGORIA_SEMANA",
      { categoria_id: "cat-1", cantidad: 0 },
      false,
      true,
    ],
    [
      "MAXIMO_PROTEINA_SEMANA",
      { proteina_id: "pro-1", cantidad: 0 },
      false,
      true,
    ],
  ])(
    "obligatoria %s devuelve flags cumplida/bloquea",
    (codigo, parametros, cumplidaEsperada, bloqueaEsperada) => {
      const reglasObligatorias = [{ id: `r-${codigo}`, codigo, parametros }];
      const salida = evaluarObligatoriasParaCandidato({
        reglasObligatorias,
        platosYaAsignados: new Set(["p-1"]),
        conteosCategorias: new Map([["cat-1", 1]]),
        conteosProteinas: new Map([["pro-1", 1]]),
        candidato: {
          ...candidatoBase,
          estado:
            codigo === "EXCLUIR_PLATOS_INACTIVOS"
              ? "INACTIVO"
              : codigo === "EXCLUIR_PLATOS_ARCHIVADOS"
                ? "ARCHIVADO"
                : "ACTIVO",
          es_estacional: codigo === "RESPETAR_TEMPORADA",
          temporada_desde: codigo === "RESPETAR_TEMPORADA" ? 2 : null,
          temporada_hasta: codigo === "RESPETAR_TEMPORADA" ? 2 : null,
          bloqueado_desde:
            codigo === "EXCLUIR_PLATOS_BLOQUEADOS" ? "2025-01-01" : null,
          bloqueado_hasta:
            codigo === "EXCLUIR_PLATOS_BLOQUEADOS" ? "2027-01-01" : null,
        },
        metricas: {
          ultima_fecha:
            codigo === "ANTIGUEDAD_MINIMA_PLATO" ? "2025-12-25" : "2025-01-01",
          usos_totales: 0,
          usos_mismo_dia: 0,
        },
        fechaObjetivo: "2026-01-01",
      });

      expect(salida.length).toBeGreaterThan(0);
      const row = salida.find((x) => x.codigo === codigo) || salida[0];
      if (codigo !== "ANTIGUEDAD_MINIMA_PLATO") {
        expect(typeof row.cumplida).toBe("boolean");
        expect(typeof row.bloquea).toBe("boolean");
      }
      if (cumplidaEsperada === false) {
        expect(row.cumplida).toBe(false);
      }
      if (bloqueaEsperada) {
        expect(row.bloquea).toBe(true);
      }
      expect(row.mensaje).toBeTruthy();
      expect(row.metricas).toBeDefined();
    },
  );

  test("viabilidad global minimos detecta conflicto", () => {
    const conflictos = evaluarViabilidadGlobalObligatorias({
      reglasObligatorias: [
        {
          id: "r-min-cat",
          codigo: "MINIMO_CATEGORIA_SEMANA",
          parametros: { categoria_id: "cat-1", cantidad: 4 },
        },
      ],
      conteosCategorias: new Map([["cat-1", 1]]),
      conteosProteinas: new Map(),
      posicionesRestantes: 2,
    });

    expect(conflictos.length).toBeGreaterThan(0);
    expect(conflictos[0].codigo).toBe("MINIMO_CATEGORIA_SEMANA");
    expect(conflictos[0].metricas).toEqual(
      expect.objectContaining({
        categoria_id: "cat-1",
        actual: 1,
        minimo: 4,
        restantes: 2,
      }),
    );
  });

  test("viabilidad global de minimos de proteina detecta conflicto", () => {
    const conflictos = evaluarViabilidadGlobalObligatorias({
      reglasObligatorias: [
        {
          id: "r-min-pro",
          codigo: "MINIMO_PROTEINA_SEMANA",
          parametros: { proteina_id: "pro-2", cantidad: 3 },
        },
      ],
      conteosCategorias: new Map(),
      conteosProteinas: new Map([["pro-2", 0]]),
      posicionesRestantes: 2,
    });

    expect(conflictos.length).toBeGreaterThan(0);
    expect(conflictos[0].codigo).toBe("MINIMO_PROTEINA_SEMANA");
    expect(conflictos[0].metricas).toEqual(
      expect.objectContaining({
        proteina_id: "pro-2",
        actual: 0,
        minimo: 3,
        restantes: 2,
      }),
    );
  });

  test("incompatibilidad min/max de categoria se detecta", () => {
    const out = detectarIncompatibilidadesObligatorias([
      {
        id: "r1",
        codigo: "MAXIMO_CATEGORIA_SEMANA",
        parametros: { categoria_id: "cat-1", cantidad: 1 },
      },
      {
        id: "r2",
        codigo: "MINIMO_CATEGORIA_SEMANA",
        parametros: { categoria_id: "cat-1", cantidad: 2 },
      },
    ]);

    expect(out.length).toBeGreaterThan(0);
  });

  test.each([
    [
      "PRIORIZAR_HISTORICO_POR_DIA",
      { factor: 1 },
      { usos_mismo_dia: 3 },
      5,
      true,
    ],
    [
      "PRIORIZAR_PLATOS_MENOS_USADOS",
      { factor: 1 },
      { ultima_fecha: "2025-01-01" },
      5,
      true,
    ],
    [
      "PRIORIZAR_PLATOS_MAS_USADOS",
      { factor: 1 },
      { usos_totales: 8 },
      5,
      true,
    ],
    [
      "PRIORIZAR_RENOVACION",
      { factor: 1 },
      { ultima_fecha: "2025-01-01" },
      5,
      true,
    ],
    ["PRIORIZAR_FAVORITOS", { factor: 1 }, {}, 5, true],
    ["PREMIAR_VARIEDAD_CATEGORIAS", {}, {}, 5, true],
    ["PREMIAR_VARIEDAD_PROTEINAS", {}, {}, 5, true],
    ["PENALIZAR_REPETICION_COMPONENTE_PRINCIPAL", {}, {}, -5, false],
    ["PENALIZAR_REPETICION_GUARNICION", {}, {}, -5, false],
  ])(
    "preferencial %s altera puntaje y detalle",
    (codigo, parametros, metricasPatch, peso, cumplidaEsperada) => {
      const reglasPreferenciales = [
        { id: `pr-${codigo}`, codigo, parametros, peso },
      ];
      const base = puntuarPreferenciales({
        reglasPreferenciales,
        metricas: {
          usos_totales: 1,
          usos_mismo_dia: 1,
          ultima_fecha: "2025-01-01",
          ...metricasPatch,
        },
        candidato: {
          ...candidatoBase,
          favorito: codigo === "PRIORIZAR_FAVORITOS",
        },
        fechaObjetivo: "2026-01-01",
        repeticionParcial: codigo.startsWith("PENALIZAR_"),
        categoriasUsadas: new Set(),
        proteinasUsadas: new Set(),
        categoriasPrevias: new Set(["cat-1"]),
        proteinasPrevias: new Set(["pro-1"]),
      });

      expect(base.detalles.length).toBe(1);
      expect(base.detalles[0].codigo).toBe(codigo);
      expect(base.detalles[0].cumplida).toBe(cumplidaEsperada);
      expect(typeof base.puntaje).toBe("number");
      expect(base.detalles[0].metricas).toBeDefined();
    },
  );

  test("preferenciales comparan candidatos con orden distinto", () => {
    const reglasPreferenciales = [
      { id: "f1", codigo: "PRIORIZAR_FAVORITOS", parametros: {}, peso: 10 },
    ];

    const favorito = puntuarPreferenciales({
      reglasPreferenciales,
      metricas: { usos_totales: 1, usos_mismo_dia: 1, ultima_fecha: null },
      candidato: { ...candidatoBase, favorito: true },
      fechaObjetivo: "2026-01-01",
      repeticionParcial: false,
      categoriasUsadas: new Set(),
      proteinasUsadas: new Set(),
      categoriasPrevias: new Set(),
      proteinasPrevias: new Set(),
    });

    const noFavorito = puntuarPreferenciales({
      reglasPreferenciales,
      metricas: { usos_totales: 1, usos_mismo_dia: 1, ultima_fecha: null },
      candidato: { ...candidatoBase, favorito: false },
      fechaObjetivo: "2026-01-01",
      repeticionParcial: false,
      categoriasUsadas: new Set(),
      proteinasUsadas: new Set(),
      categoriasPrevias: new Set(),
      proteinasPrevias: new Set(),
    });

    expect(favorito.puntaje).toBeGreaterThan(noFavorito.puntaje);
  });

  test("override de peso altera la diferencia de puntaje", () => {
    const base = puntuarPreferenciales({
      reglasPreferenciales: [
        {
          id: "h-base",
          codigo: "PRIORIZAR_HISTORICO_POR_DIA",
          parametros: { factor: 1 },
          peso: 2,
        },
      ],
      metricas: { usos_totales: 2, usos_mismo_dia: 2, ultima_fecha: null },
      candidato: { ...candidatoBase, favorito: false },
      fechaObjetivo: "2026-01-01",
      repeticionParcial: false,
      categoriasUsadas: new Set(),
      proteinasUsadas: new Set(),
      categoriasPrevias: new Set(),
      proteinasPrevias: new Set(),
    });

    const override = puntuarPreferenciales({
      reglasPreferenciales: [
        {
          id: "h-override",
          codigo: "PRIORIZAR_HISTORICO_POR_DIA",
          parametros: { factor: 1 },
          peso: 10,
        },
      ],
      metricas: { usos_totales: 2, usos_mismo_dia: 2, ultima_fecha: null },
      candidato: { ...candidatoBase, favorito: false },
      fechaObjetivo: "2026-01-01",
      repeticionParcial: false,
      categoriasUsadas: new Set(),
      proteinasUsadas: new Set(),
      categoriasPrevias: new Set(),
      proteinasPrevias: new Set(),
    });

    expect(override.puntaje).toBeGreaterThan(base.puntaje);
    expect(override.detalles[0].codigo).toBe("PRIORIZAR_HISTORICO_POR_DIA");
  });
});
