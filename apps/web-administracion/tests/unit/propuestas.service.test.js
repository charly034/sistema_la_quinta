import { beforeEach, describe, expect, it, vi } from "vitest";

const postMock = vi.hoisted(() => vi.fn());
const getMock = vi.hoisted(() => vi.fn());

vi.mock("../../src/api/cliente-api", () => ({
  clienteApi: {
    post: postMock,
    get: getMock,
  },
}));

import {
  aplicarPropuesta,
  generarPropuestaPersonalizada,
} from "../../src/services/propuestas.service";

describe("generación y aplicación de propuesta", () => {
  beforeEach(() => {
    postMock.mockReset();
    getMock.mockReset();
  });

  it("genera propuesta personalizada", async () => {
    postMock.mockResolvedValueOnce({ data: { data: { id: "prop-1" } } });

    const payload = { semilla: 1234, respetarPosicionesExistentes: true };
    const out = await generarPropuestaPersonalizada("sem-1", "ver-1", payload);

    expect(postMock).toHaveBeenCalledWith(
      "/menu/semanas/sem-1/versiones/ver-1/propuestas/generar-personalizada",
      payload,
      { timeout: 120000 },
    );
    expect(out.id).toBe("prop-1");
  });

  it("aplica propuesta", async () => {
    postMock.mockResolvedValueOnce({ data: { data: { aplicada: true } } });

    const out = await aplicarPropuesta("sem-1", "ver-1", "prop-1");

    expect(postMock).toHaveBeenCalledWith(
      "/menu/semanas/sem-1/versiones/ver-1/propuestas/prop-1/aplicar",
    );
    expect(out.aplicada).toBe(true);
  });
});
