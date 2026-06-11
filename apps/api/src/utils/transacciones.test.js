import { describe, expect, test, jest, beforeEach } from "@jest/globals";

const cliente = {
  query: jest.fn(),
  release: jest.fn(),
};

const pool = {
  connect: jest.fn(),
};

jest.unstable_mockModule("../config/db.js", () => ({
  getPool: jest.fn(() => pool),
}));

const { ejecutarEnTransaccion } = await import("./transacciones.js");

describe("transacciones", () => {
  beforeEach(() => {
    cliente.query.mockReset();
    cliente.release.mockReset();
    pool.connect.mockReset();
    pool.connect.mockResolvedValue(cliente);
  });

  test("confirma transacciones cuando el callback funciona", async () => {
    cliente.query.mockResolvedValue(undefined);

    const resultado = await ejecutarEnTransaccion(async (conexion) => {
      expect(conexion).toBe(cliente);
      return "ok";
    });

    expect(resultado).toBe("ok");
    expect(cliente.query.mock.calls.map((llamada) => llamada[0])).toEqual([
      "BEGIN",
      "COMMIT",
    ]);
    expect(cliente.release).toHaveBeenCalledTimes(1);
  });

  test("revierte la transaccion cuando el callback falla", async () => {
    cliente.query.mockResolvedValue(undefined);
    const error = new Error("fallo");

    await expect(
      ejecutarEnTransaccion(async () => {
        throw error;
      }),
    ).rejects.toThrow("fallo");

    expect(cliente.query.mock.calls.map((llamada) => llamada[0])).toEqual([
      "BEGIN",
      "ROLLBACK",
    ]);
    expect(cliente.release).toHaveBeenCalledTimes(1);
  });
});
