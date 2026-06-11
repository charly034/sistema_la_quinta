import {
  obtenerPlantillaParaContexto,
  generarMensajeWhatsapp,
} from "../plantillas-menus.servicio.js";

describe("Plantillas menus - resolucion de contexto", () => {
  const ids = {
    marca: "11111111-1111-1111-1111-111111111111",
    canal: "22222222-2222-2222-2222-222222222222",
    empresa: "33333333-3333-3333-3333-333333333333",
  };

  function crearDbMock(rowsPorLlamada) {
    let i = 0;
    return {
      query: async () => ({ rows: rowsPorLlamada[i++] || [] }),
    };
  }

  it("resuelve plantilla especifica por empresa", async () => {
    const db = crearDbMock([[{ cantidad: 1 }], [{ id: "p-empresa" }]]);
    const plantilla = await obtenerPlantillaParaContexto(
      db,
      ids.marca,
      ids.canal,
      ids.empresa,
      "WHATSAPP",
    );
    expect(plantilla.id).toBe("p-empresa");
  });

  it("hace fallback por canal", async () => {
    const db = crearDbMock([[{ cantidad: 1 }], [{ id: "p-canal" }]]);
    const plantilla = await obtenerPlantillaParaContexto(
      db,
      ids.marca,
      ids.canal,
      null,
      "WHATSAPP",
    );
    expect(plantilla.id).toBe("p-canal");
  });

  it("hace fallback por marca", async () => {
    const db = crearDbMock([[{ cantidad: 1 }], [{ id: "p-marca" }]]);
    const plantilla = await obtenerPlantillaParaContexto(
      db,
      ids.marca,
      null,
      null,
      "WHATSAPP",
    );
    expect(plantilla.id).toBe("p-marca");
  });

  it("hace fallback global", async () => {
    const db = crearDbMock([
      [{ cantidad: 1 }],
      [{ id: "p-global", es_predeterminada: true }],
    ]);
    const plantilla = await obtenerPlantillaParaContexto(
      db,
      null,
      null,
      null,
      "WHATSAPP",
    );
    expect(plantilla.id).toBe("p-global");
  });

  it("rechaza dos plantillas incompatibles con misma prioridad", async () => {
    const db = crearDbMock([[{ cantidad: 2 }]]);
    await expect(
      obtenerPlantillaParaContexto(
        db,
        ids.marca,
        ids.canal,
        ids.empresa,
        "WHATSAPP",
      ),
    ).rejects.toMatchObject({ code: "PLANTILLA_AMBIGUA" });
  });

  it("devuelve error controlado sin plantilla", async () => {
    const db = crearDbMock([[{ cantidad: 0 }], []]);
    await expect(
      obtenerPlantillaParaContexto(
        db,
        ids.marca,
        ids.canal,
        ids.empresa,
        "WHATSAPP",
      ),
    ).rejects.toMatchObject({ code: "PLANTILLA_NO_ENCONTRADA" });
  });

  it("encuentra plantilla de La Quinta", async () => {
    const db = crearDbMock([
      [{ cantidad: 1 }],
      [
        {
          id: "p-la-quinta",
          nombre: "Plantilla predeterminada WhatsApp La Quinta",
        },
      ],
    ]);
    const plantilla = await obtenerPlantillaParaContexto(
      db,
      ids.marca,
      null,
      null,
      "WHATSAPP",
    );
    expect(plantilla.nombre).toContain("La Quinta");
  });

  it("genera mensaje con rango operativo y opciones ordenadas", async () => {
    const db = {
      query: async (sql) => {
        if (sql.includes("FROM plantillas_mensaje_menu WHERE id")) {
          return {
            rows: [
              {
                id: "plantilla-1",
                nombre: "Plantilla predeterminada WhatsApp La Quinta",
                tipo: "WHATSAPP",
                plantilla: "🗓️ SEMANA {{rango_semana}}\\n\\n{{contenido_dias}}",
                configuracion: {
                  incluir_feriados: true,
                  incluir_cerrados: false,
                  incluir_sin_configurar: false,
                  incluir_fin_de_semana: false,
                  mostrar_fecha_en_feriados: false,
                },
              },
            ],
          };
        }
        if (sql.includes("FROM dias_version_menu")) {
          return {
            rows: [
              {
                id: "d1",
                nombre_dia: "Lunes",
                fecha: "2026-06-16",
                estado_dia: "FERIADO",
                observaciones: null,
              },
              {
                id: "d2",
                nombre_dia: "Martes",
                fecha: "2026-06-17",
                estado_dia: "DIA_LABORAL",
                observaciones: null,
              },
            ],
          };
        }
        if (sql.includes("FROM opciones_dia_menu odm")) {
          return {
            rows: [
              { codigo_opcion: "A", nombre_plato: "Arroz con pollo" },
              {
                codigo_opcion: "C",
                nombre_plato: "Tallarines de espinaca con ensalada mixta",
              },
            ],
          };
        }
        return { rows: [] };
      },
    };

    const mensaje = await generarMensajeWhatsapp(
      db,
      "v1",
      "plantilla-1",
      ids.marca,
      {
        nombre_marca: "La Quinta",
        fecha_inicio: "2026-06-16",
        fecha_fin: "2026-06-19",
      },
    );

    expect(mensaje.mensaje).toContain("16/06 AL 17/06");
    expect(mensaje.mensaje).toContain("📍 Lunes");
    expect(mensaje.mensaje).toContain("FERIADO");
    expect(mensaje.mensaje).toContain("A: Arroz con pollo");
    expect(mensaje.mensaje).toContain(
      "C: Tallarines de espinaca con ensalada mixta",
    );
  });

  it("omite día laboral vacío en generación desde borrador", async () => {
    const db = {
      query: async (sql, params) => {
        if (sql.includes("FROM plantillas_mensaje_menu WHERE id")) {
          return {
            rows: [
              {
                id: "plantilla-2",
                nombre: "Plantilla predeterminada WhatsApp La Quinta",
                tipo: "WHATSAPP",
                plantilla: "🗓️ SEMANA {{rango_semana}}\\n\\n{{contenido_dias}}",
                configuracion: {
                  incluir_feriados: true,
                  incluir_cerrados: false,
                  incluir_sin_configurar: false,
                  incluir_fin_de_semana: false,
                  mostrar_fecha_en_feriados: false,
                },
              },
            ],
          };
        }
        if (sql.includes("FROM dias_version_menu")) {
          return {
            rows: [
              {
                id: "d1",
                nombre_dia: "Martes",
                fecha: "2026-07-14",
                estado_dia: "DIA_LABORAL",
                observaciones: null,
              },
              {
                id: "d2",
                nombre_dia: "Miércoles",
                fecha: "2026-07-15",
                estado_dia: "DIA_LABORAL",
                observaciones: null,
              },
            ],
          };
        }
        if (sql.includes("FROM opciones_dia_menu odm")) {
          if (params[0] === "d1") {
            return {
              rows: [{ codigo_opcion: "A", nombre_plato: "Arroz con pollo" }],
            };
          }
          return { rows: [] };
        }
        return { rows: [] };
      },
    };

    const mensaje = await generarMensajeWhatsapp(
      db,
      "v2",
      "plantilla-2",
      ids.marca,
      {
        nombre_marca: "La Quinta",
        fecha_inicio: "2026-07-14",
        fecha_fin: "2026-07-19",
      },
    );

    expect(mensaje.mensaje).toContain("📍 Martes 14/07");
    expect(mensaje.mensaje).toContain("A: Arroz con pollo");
    expect(mensaje.mensaje).not.toContain("📍 Miércoles 15/07\n\n");
  });

  it("omite cerrado y sin configurar por defecto y mantiene feriado", async () => {
    const db = {
      query: async (sql, params) => {
        if (sql.includes("FROM plantillas_mensaje_menu WHERE id")) {
          return {
            rows: [
              {
                id: "plantilla-3",
                nombre: "Plantilla predeterminada WhatsApp La Quinta",
                tipo: "WHATSAPP",
                plantilla: "🗓️ SEMANA {{rango_semana}}\\n\\n{{contenido_dias}}",
                configuracion: {
                  incluir_feriados: true,
                  incluir_cerrados: false,
                  incluir_sin_configurar: false,
                  incluir_fin_de_semana: false,
                  mostrar_fecha_en_feriados: false,
                },
              },
            ],
          };
        }
        if (sql.includes("FROM dias_version_menu")) {
          return {
            rows: [
              {
                id: "d1",
                nombre_dia: "Lunes",
                fecha: "2026-07-13",
                estado_dia: "FERIADO",
                observaciones: null,
              },
              {
                id: "d2",
                nombre_dia: "Sábado",
                fecha: "2026-07-18",
                estado_dia: "CERRADO",
                observaciones: null,
              },
              {
                id: "d3",
                nombre_dia: "Domingo",
                fecha: "2026-07-19",
                estado_dia: "SIN_CONFIGURAR",
                observaciones: null,
              },
            ],
          };
        }
        if (sql.includes("FROM opciones_dia_menu odm")) {
          return { rows: [] };
        }
        return { rows: [] };
      },
    };

    const mensaje = await generarMensajeWhatsapp(
      db,
      "v3",
      "plantilla-3",
      ids.marca,
      {
        nombre_marca: "La Quinta",
        fecha_inicio: "2026-07-13",
        fecha_fin: "2026-07-19",
      },
    );

    expect(mensaje.mensaje).toContain("📍 Lunes");
    expect(mensaje.mensaje).toContain("FERIADO");
    expect(mensaje.mensaje).not.toContain("Sábado");
    expect(mensaje.mensaje).not.toContain("Domingo");
  });
});
