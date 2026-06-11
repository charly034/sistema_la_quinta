import {
  transicionarEstado,
  asignarPlatoAOpcion,
} from "../menus-semanales.servicio.js";

describe("Menús semanales - validación de transiciones", () => {
  function crearDbBase({ estadoActual = "PROPUESTO", diasVacios = [] } = {}) {
    const db = {
      query: async (sql) => {
        if (sql.includes("SELECT * FROM versiones_semana_menu WHERE id")) {
          return {
            rows: [
              {
                id: "11111111-1111-4111-8111-111111111111",
                semana_menu_id: "22222222-2222-4222-8222-222222222222",
                estado: estadoActual,
              },
            ],
          };
        }

        if (
          sql.includes("FROM dias_version_menu d") &&
          sql.includes("estado_dia = 'DIA_LABORAL'")
        ) {
          return { rows: diasVacios };
        }

        if (sql.includes("UPDATE versiones_semana_menu SET estado")) {
          return {
            rows: [
              {
                id: "11111111-1111-4111-8111-111111111111",
                semana_menu_id: "22222222-2222-4222-8222-222222222222",
                estado: "APROBADO",
              },
            ],
          };
        }

        return { rows: [] };
      },
      ejecutarEnTransaccion: async (fn) => fn(db),
    };

    return db;
  }

  it("rechaza aprobación si hay día laboral sin opciones", async () => {
    const db = crearDbBase({
      estadoActual: "PROPUESTO",
      diasVacios: [
        {
          id: "dia-1",
          nombre_dia: "Miércoles",
          fecha: "2026-07-15",
        },
      ],
    });

    await expect(
      transicionarEstado(
        db,
        {
          versionId: "11111111-1111-4111-8111-111111111111",
          estadoNuevo: "APROBADO",
          motivo: "validación",
        },
        "33333333-3333-4333-8333-333333333333",
      ),
    ).rejects.toMatchObject({ code: "DIA_LABORAL_SIN_OPCIONES" });
  });

  it("rechaza publicación si hay día laboral sin opciones", async () => {
    const db = crearDbBase({
      estadoActual: "APROBADO",
      diasVacios: [
        {
          id: "dia-2",
          nombre_dia: "Jueves",
          fecha: "2026-07-16",
        },
      ],
    });

    await expect(
      transicionarEstado(
        db,
        {
          versionId: "11111111-1111-4111-8111-111111111111",
          estadoNuevo: "PUBLICADO",
          motivo: "validación",
        },
        "33333333-3333-4333-8333-333333333333",
      ),
    ).rejects.toMatchObject({ code: "DIA_LABORAL_SIN_OPCIONES" });
  });

  it("rechaza edición cuando la versión está publicada", async () => {
    const db = {
      query: async (sql) => {
        if (sql.includes("SELECT * FROM dias_version_menu WHERE id")) {
          return {
            rows: [
              {
                id: "44444444-4444-4444-8444-444444444444",
                version_semana_id: "11111111-1111-4111-8111-111111111111",
              },
            ],
          };
        }

        if (sql.includes("SELECT * FROM versiones_semana_menu WHERE id")) {
          return {
            rows: [
              {
                id: "11111111-1111-4111-8111-111111111111",
                estado: "PUBLICADO",
              },
            ],
          };
        }

        return { rows: [] };
      },
      ejecutarEnTransaccion: async (fn) => fn(db),
    };

    await expect(
      asignarPlatoAOpcion(
        db,
        {
          diaId: "44444444-4444-4444-8444-444444444444",
          opcionMenuMarcaId: "55555555-5555-4555-8555-555555555555",
          platoId: "66666666-6666-4666-8666-666666666666",
        },
        "33333333-3333-4333-8333-333333333333",
      ),
    ).rejects.toMatchObject({ code: "VERSION_NO_EDITABLE" });
  });
});
