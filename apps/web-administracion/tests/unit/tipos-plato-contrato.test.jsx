/**
 * Vitest: Contrato de tipos de plato
 *
 * Confirma que el formulario de PlatosPage solo expone los tipos aceptados por la API:
 *   PREPARACION     → aceptado ✓
 *   GUARNICION      → aceptado ✓
 *   PLATO_COMPLETO  → aceptado ✓
 *   PRINCIPAL       → no debe aparecer ✗
 *   POSTRE          → no debe aparecer ✗
 *   ENSALADA        → no debe aparecer ✗
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import PlatosPage from "../../src/pages/PlatosPage";

vi.mock("../../src/services/platos.service", () => ({
  listarPlatos: vi.fn(async () => ({ items: [] })),
  crearPlato: vi.fn(async () => ({ id: "p-test" })),
  actualizarEstadoPlato: vi.fn(async () => ({})),
  actualizarFavoritoPlato: vi.fn(async () => ({})),
}));

vi.mock("../../src/services/admin.service", () => ({
  listarMarcas: vi.fn(async () => ({ items: [] })),
}));

function renderConQuery(ui) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("Contrato de tipos de plato", () => {
  it("el select expone exactamente los tipos válidos del backend", async () => {
    renderConQuery(<PlatosPage />);
    const select = await screen.findByTestId(
      "tipo-plato",
      {},
      { timeout: 5000 },
    );
    const options = within(select).getAllByRole("option");
    const valores = options.map((o) => o.value);

    // Tipos aceptados por la API
    expect(valores).toContain("PREPARACION");
    expect(valores).toContain("GUARNICION");
    expect(valores).toContain("PLATO_COMPLETO");

    // Tipos que NO debe ofrecer el frontend
    expect(valores).not.toContain("PRINCIPAL");
    expect(valores).not.toContain("POSTRE");
    expect(valores).not.toContain("ENSALADA");
  });

  it("el valor predeterminado es PREPARACION", async () => {
    renderConQuery(<PlatosPage />);
    const select = await screen.findByTestId(
      "tipo-plato",
      {},
      { timeout: 5000 },
    );
    expect(select.value).toBe("PREPARACION");
  });

  it("existe exactamente un tipo por cada valor válido del backend (3 total)", async () => {
    renderConQuery(<PlatosPage />);
    const select = await screen.findByTestId(
      "tipo-plato",
      {},
      { timeout: 5000 },
    );
    const options = within(select).getAllByRole("option");
    expect(options).toHaveLength(3);
    expect(options.map((o) => o.value).sort()).toEqual([
      "GUARNICION",
      "PLATO_COMPLETO",
      "PREPARACION",
    ]);
  });
});
