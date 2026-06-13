import { beforeEach, describe, expect, it, vi } from "vitest";

const getBinarioMock = vi.hoisted(() => vi.fn());

vi.mock("../../src/api/cliente-api", () => ({
  clienteApi: {
    get: vi.fn(),
    put: vi.fn(),
  },
  getBinario: getBinarioMock,
}));

import { descargarExcel } from "../../src/services/menus.service";

describe("descarga Excel", () => {
  beforeEach(() => {
    getBinarioMock.mockReset();
  });

  it("solicita blob de Excel", async () => {
    getBinarioMock.mockResolvedValueOnce({
      data: new Blob(["x"]),
      headers: {},
    });

    const out = await descargarExcel("sem-1", { versionId: "ver-1" });

    expect(getBinarioMock).toHaveBeenCalledWith(
      "/menu/semanas/sem-1/exportar/excel",
      { params: { versionId: "ver-1" } },
    );
    expect(out).toBeTruthy();
  });
});
