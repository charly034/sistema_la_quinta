import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

    await userEvent.type(
      screen.getByLabelText("Correo"),
      "admin@laquinta.local",
    );
    await userEvent.type(screen.getByLabelText("Contraseña"), "password123");
    await userEvent.click(screen.getByRole("button", { name: "Ingresar" }));
  });
});
