import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PlatosPage from "../../src/pages/PlatosPage";

const mocks = vi.hoisted(() => ({
  listarPlatos: vi.fn(async () => ({ items: [] })),
  crearPlato: vi.fn(async () => ({ id: "p1" })),
  actualizarEstadoPlato: vi.fn(async () => ({})),
  actualizarFavoritoPlato: vi.fn(async () => ({})),
  listarMarcas: vi.fn(async () => ({
    items: [{ id: "m1", nombre: "Marca 1" }],
  })),
}));

vi.mock("../../src/services/platos.service", () => ({
  listarPlatos: mocks.listarPlatos,
  crearPlato: mocks.crearPlato,
  actualizarEstadoPlato: mocks.actualizarEstadoPlato,
  actualizarFavoritoPlato: mocks.actualizarFavoritoPlato,
}));

vi.mock("../../src/services/admin.service", () => ({
  listarMarcas: mocks.listarMarcas,
}));

function renderWithQuery(ui) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe("formulario mínimo de plato", () => {
  it("envía alta mínima", async () => {
    renderWithQuery(<PlatosPage />);

    await screen.findByRole(
      "heading",
      { name: "Catálogo de platos" },
      { timeout: 15000 },
    );

    await waitFor(() => {
      expect(mocks.listarPlatos).toHaveBeenCalled();
      expect(mocks.listarMarcas).toHaveBeenCalled();
    });

    await userEvent.type(screen.getByPlaceholderText("Marca ID"), "m1");
    await userEvent.type(
      screen.getByPlaceholderText("Nombre"),
      "Plato QA mínimo",
    );
    await userEvent.click(screen.getByRole("button", { name: "Crear plato" }));

    await waitFor(() => {
      const [payload] = mocks.crearPlato.mock.calls[0] || [];
      expect(payload).toEqual({
        marcaId: "m1",
        tipo: "PREPARACION",
        nombre: "Plato QA mínimo",
      });
    });
  }, 15000);
});
