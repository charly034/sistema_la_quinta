import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CopiarTexto from "../../src/components/shared/CopiarTexto";

describe("copiar WhatsApp", () => {
  it("copia el texto y muestra confirmación", async () => {
    const writeText = vi.fn(async () => {});
    Object.assign(globalThis.navigator, {
      clipboard: { writeText },
    });

    render(<CopiarTexto contenido="Mensaje para WhatsApp" etiqueta="Copiar" />);

    await userEvent.click(screen.getByRole("button", { name: "Copiar" }));

    expect(writeText).toHaveBeenCalledWith("Mensaje para WhatsApp");
    expect(screen.getByRole("button", { name: "Copiado" })).toBeInTheDocument();
  });
});
