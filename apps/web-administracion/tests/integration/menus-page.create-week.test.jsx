// @vitest-environment jsdom
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import MenusPage from "../../src/pages/MenusPage";

const authState = vi.hoisted(() => ({
  usuario: { id: "u1", permisos: ["MENUS_GESTIONAR"] },
}));

const toastSuccess = vi.hoisted(() => vi.fn());

vi.mock("../../src/auth/AuthProvider", () => ({
  useAuth: () => authState,
}));

vi.mock("sonner", () => ({
  toast: { success: toastSuccess },
}));

const API = (
  import.meta.env?.VITE_API_URL || "http://localhost:3000/api/v1"
).replace(/\/$/, "");

const server = setupServer();

function renderMenusPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/menus"]}>
        <Routes>
          <Route path="/menus" element={<MenusPage />} />
          <Route
            path="/menus/:semanaId/versiones/:versionId"
            element={<div>Editor semanal cargado</div>}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("MenusPage - crear semana", () => {
  let semanas;
  let postCalls;
  let ultimoPayload;

  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => {
    server.resetHandlers();
    toastSuccess.mockReset();
    cleanup();
  });
  afterAll(() => server.close());

  beforeEach(() => {
    semanas = [];
    postCalls = 0;
    ultimoPayload = null;
    authState.usuario = { id: "u1", permisos: ["MENUS_GESTIONAR"] };

    server.use(
      http.get(`${API}/menu/semanas`, () => {
        return HttpResponse.json({ exito: true, datos: { semanas } });
      }),
      http.get(`${API}/marcas`, () => {
        return HttpResponse.json({
          exito: true,
          datos: { items: [{ id: "m1", nombre: "Marca 1" }] },
        });
      }),
      http.get(`${API}/canales`, () => {
        return HttpResponse.json({
          exito: true,
          datos: { items: [{ id: "c1", nombre: "Canal 1" }] },
        });
      }),
      http.get(`${API}/empresas`, () => {
        return HttpResponse.json({
          exito: true,
          datos: {
            items: [
              { id: "e1", nombre: "Empresa 1", marcaId: "m1" },
              { id: "e2", nombre: "Empresa 2", marcaId: "otra" },
            ],
          },
        });
      }),
      http.post(`${API}/menu/semanas`, async ({ request }) => {
        postCalls += 1;
        ultimoPayload = await request.json();
        const semana = { id: "sem-1" };
        const versionInicial = { id: "ver-1" };
        semanas = [{ id: "sem-1", fechaInicio: ultimoPayload.fechaInicio }];
        return HttpResponse.json(
          { exito: true, datos: { semana, versionInicial } },
          { status: 201 },
        );
      }),
    );
  });

  it("muestra el botón con permiso", async () => {
    renderMenusPage();
    expect(
      await screen.findByRole("button", { name: "Crear semana" }),
    ).toBeTruthy();
  });

  it("oculta el botón sin permiso", async () => {
    authState.usuario = { id: "u1", permisos: [] };
    renderMenusPage();
    await screen.findByRole("heading", { name: "Menús semanales" });
    expect(screen.queryByRole("button", { name: "Crear semana" })).toBeNull();
  });

  it("valida formulario requerido y lunes obligatorio", async () => {
    renderMenusPage();
    await userEvent.click(
      await screen.findByRole("button", { name: "Crear semana" }),
    );
    const dialog = await screen.findByRole("dialog");
    const ui = within(dialog);

    await userEvent.click(ui.getByRole("button", { name: "Guardar semana" }));
    expect(await ui.findByText("La marca es obligatoria.")).toBeTruthy();
    expect(
      await ui.findByText("La fecha de inicio es obligatoria."),
    ).toBeTruthy();

    await userEvent.selectOptions(ui.getAllByRole("combobox")[0], "m1");
    await userEvent.type(
      dialog.querySelector('input[type="date"]'),
      "2044-01-05",
    );
    await userEvent.click(ui.getByRole("button", { name: "Guardar semana" }));

    expect(
      await ui.findByText("La fecha de inicio debe ser un lunes."),
    ).toBeTruthy();
    expect(postCalls).toBe(0);
  });

  it("normaliza opcionales, redirige al editor e invalida semanas", async () => {
    renderMenusPage();
    await userEvent.click(
      await screen.findByRole("button", { name: "Crear semana" }),
    );
    const dialog = await screen.findByRole("dialog");
    const ui = within(dialog);

    await userEvent.selectOptions(ui.getByLabelText("Marca"), "m1");
    await userEvent.type(ui.getByLabelText("Fecha de inicio"), "2044-01-04");
    await userEvent.click(ui.getByRole("button", { name: "Guardar semana" }));

    expect(await screen.findByText("Editor semanal cargado")).toBeTruthy();
    expect(postCalls).toBe(1);
    expect(ultimoPayload).toEqual({
      marcaId: "m1",
      canalId: null,
      empresaId: null,
      fechaInicio: "2044-01-04",
      fechaFin: "2044-01-10",
    });
    expect(toastSuccess).toHaveBeenCalledTimes(1);
  });

  it("muestra error amigable de duplicado y no redirige", async () => {
    server.use(
      http.post(`${API}/menu/semanas`, async () => {
        return HttpResponse.json(
          {
            exito: false,
            error: {
              codigo: "SEMANA_DUPLICADA_CONTEXTO",
              mensaje: "duplicada",
            },
          },
          { status: 409 },
        );
      }),
    );

    renderMenusPage();
    await userEvent.click(
      await screen.findByRole("button", { name: "Crear semana" }),
    );
    const dialog = await screen.findByRole("dialog");
    const ui = within(dialog);
    await userEvent.selectOptions(ui.getByLabelText("Marca"), "m1");
    await userEvent.type(ui.getByLabelText("Fecha de inicio"), "2044-01-04");
    await userEvent.click(ui.getByRole("button", { name: "Guardar semana" }));

    expect(
      await ui.findByText("Ya existe una semana para ese contexto y fecha."),
    ).toBeTruthy();
    expect(screen.queryByText("Editor semanal cargado")).toBeNull();
  });

  it("muestra error amigable cuando la empresa no pertenece a la marca", async () => {
    server.use(
      http.post(`${API}/menu/semanas`, async () => {
        return HttpResponse.json(
          {
            exito: false,
            error: {
              codigo: "EMPRESA_NO_ASOCIADA_A_MARCA",
              mensaje: "empresa inválida",
            },
          },
          { status: 409 },
        );
      }),
    );

    renderMenusPage();
    await userEvent.click(
      await screen.findByRole("button", { name: "Crear semana" }),
    );
    const dialog = await screen.findByRole("dialog");
    const ui = within(dialog);
    await userEvent.selectOptions(ui.getByLabelText("Marca"), "m1");
    await userEvent.selectOptions(ui.getByLabelText("Empresa"), "e1");
    await userEvent.type(ui.getByLabelText("Fecha de inicio"), "2044-01-04");
    await userEvent.click(ui.getByRole("button", { name: "Guardar semana" }));

    expect(
      await ui.findByText("La empresa seleccionada no pertenece a la marca."),
    ).toBeTruthy();
  });

  it("impide doble envío al hacer doble clic", async () => {
    server.use(
      http.post(`${API}/menu/semanas`, async ({ request }) => {
        postCalls += 1;
        ultimoPayload = await request.json();
        await new Promise((resolve) => setTimeout(resolve, 80));
        return HttpResponse.json(
          {
            exito: true,
            datos: { semana: { id: "sem-1" }, versionInicial: { id: "ver-1" } },
          },
          { status: 201 },
        );
      }),
    );

    renderMenusPage();
    await userEvent.click(
      await screen.findByRole("button", { name: "Crear semana" }),
    );
    const dialog = await screen.findByRole("dialog");
    const ui = within(dialog);
    await userEvent.selectOptions(ui.getByLabelText("Marca"), "m1");
    await userEvent.type(ui.getByLabelText("Fecha de inicio"), "2044-01-04");
    await userEvent.dblClick(
      ui.getByRole("button", { name: "Guardar semana" }),
    );

    await waitFor(() => {
      expect(postCalls).toBe(1);
    });
  });
});
