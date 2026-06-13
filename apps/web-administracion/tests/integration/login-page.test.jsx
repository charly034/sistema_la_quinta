import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import IniciarSesionPage from "../../src/pages/IniciarSesionPage";

vi.mock("../../src/auth/AuthProvider", () => ({
  useAuth: () => ({
    autenticado: false,
    login: vi.fn(async () => ({})),
  }),
}));

describe("login", () => {
  it("muestra formulario en español", async () => {
    render(
      <BrowserRouter>
        <IniciarSesionPage />
      </BrowserRouter>,
    );

    expect(screen.getByText("Iniciar sesión")).toBeInTheDocument();
    expect(screen.getByLabelText("Correo")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ingresar" }),
    ).toBeInTheDocument();
  });
});
