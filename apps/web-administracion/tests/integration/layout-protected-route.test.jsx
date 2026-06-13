import { describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import LayoutPrincipal from "../../src/components/layout/LayoutPrincipal";

const authState = vi.hoisted(() => ({
  usuario: null,
  cargandoPerfil: false,
  logout: vi.fn(),
}));

vi.mock("../../src/auth/AuthProvider", () => ({
  useAuth: () => authState,
}));

describe("ruta protegida", () => {
  it("redirige al login cuando no hay usuario", () => {
    authState.usuario = null;
    authState.cargandoPerfil = false;

    render(
      <MemoryRouter initialEntries={["/inicio"]}>
        <Routes>
          <Route element={<LayoutPrincipal />}>
            <Route path="/inicio" element={<div>Inicio privado</div>} />
          </Route>
          <Route path="/iniciar-sesion" element={<div>Login público</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Login público")).toBeInTheDocument();
  });

  it("renderiza contenido cuando hay sesión", () => {
    authState.usuario = { id: "u1", nombre: "Admin", permisos: [] };
    authState.cargandoPerfil = false;

    render(
      <MemoryRouter initialEntries={["/inicio"]}>
        <Routes>
          <Route element={<LayoutPrincipal />}>
            <Route path="/inicio" element={<div>Inicio privado</div>} />
          </Route>
          <Route path="/iniciar-sesion" element={<div>Login público</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Inicio privado")).toBeInTheDocument();
  });
});
