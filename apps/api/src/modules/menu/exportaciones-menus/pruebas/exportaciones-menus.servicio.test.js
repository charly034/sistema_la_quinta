import ExcelJS from "exceljs";
import {
  exportarAExcel,
  generarNombreArchivoExportacion,
} from "../exportaciones-menus.servicio.js";

describe("Exportaciones menus - Excel", () => {
  it("genera workbook legible y validable con ExcelJS", async () => {
    const db = {
      query: async (sql, params) => {
        if (sql.includes("FROM dias_version_menu")) {
          return {
            rows: [
              {
                id: "dia-1",
                nombre_dia: "Lunes",
                fecha: "2026-06-16",
                estado_dia: "FERIADO",
                observaciones: "FERIADO",
              },
              {
                id: "dia-2",
                nombre_dia: "Martes",
                fecha: "2026-06-17",
                estado_dia: "DIA_LABORAL",
                observaciones: null,
              },
            ],
          };
        }
        if (sql.includes("SELECT nombre_opcion FROM opciones_dia_menu")) {
          if (params[0] === "dia-1") return { rows: [] };
          return {
            rows: [
              { nombre_opcion: "Arroz con pollo" },
              { nombre_opcion: "Tallarines de espinaca con ensalada mixta" },
            ],
          };
        }
        return { rows: [] };
      },
    };

    const workbook = await exportarAExcel(db, "v-1", {
      fechaInicio: "2026-06-16",
      fechaFin: "2026-06-19",
      nombreMarca: "La Quinta",
    });

    const bytes = await workbook.xlsx.writeBuffer();
    expect(bytes.byteLength).toBeGreaterThan(0);

    const reopened = new ExcelJS.Workbook();
    await reopened.xlsx.load(Buffer.from(bytes));

    const sheet = reopened.getWorksheet("Menú Semanal");
    expect(sheet).toBeDefined();

    expect(sheet.getCell("A4").value).toBe("Día");
    expect(sheet.getCell("B4").value).toBe("Fecha");
    expect(sheet.getCell("C4").value).toBe("Estado");
    expect(sheet.getCell("D4").value).toBe("Opciones");

    const header = String(sheet.getCell("A1").value || "");
    expect(header).toContain("MENÚ SEMANAL");

    const feriadoEstado = String(sheet.getCell("C5").value || "");
    expect(feriadoEstado).toContain("Feriado");

    const opcionesTexto = String(sheet.getCell("D6").value || "");
    expect(opcionesTexto).toContain("A)");
    expect(opcionesTexto).toContain("Arroz con pollo");
  });

  it("genera nombre de archivo seguro", () => {
    const nombre = generarNombreArchivoExportacion(
      "Menú La Quinta / Centro",
      "2026-06-16",
      "xlsx",
    );

    expect(nombre).toMatch(/^menu-[a-z0-9_-]+-[0-9-]+-[0-9-]+\.xlsx$/);
    expect(nombre).not.toContain(" ");
    expect(nombre).not.toContain("/");
  });
});
