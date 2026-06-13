// @vitest-environment node
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
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  clienteApi,
  setManejadorSesionExpirada,
} from "../../src/api/cliente-api";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "../../src/auth/token-store";

const API = (
  import.meta.env?.VITE_API_URL || "http://localhost:3000/api/v1"
).replace(/\/$/, "");

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  clearTokens();
});
afterAll(() => server.close());

beforeEach(() => {
  clearTokens();
});

describe("cliente-api refresh", () => {
  it("renueva sesión en 401 y reintenta una vez", async () => {
    setTokens({ accessToken: "access-vencido", refreshToken: "refresh-ok" });

    server.use(
      http.get(`${API}/protegido`, ({ request }) => {
        const auth = request.headers.get("authorization");
        if (auth === "Bearer access-nuevo") {
          return HttpResponse.json({ data: { ok: true } });
        }
        return HttpResponse.json({ error: "unauthorized" }, { status: 401 });
      }),
      http.post(`${API}/autenticacion/renovar-sesion`, async () => {
        return HttpResponse.json({
          data: { accessToken: "access-nuevo", refreshToken: "refresh-nuevo" },
        });
      }),
    );

    const out = await clienteApi.get("/protegido");
    expect(out.data.data.ok).toBe(true);
    expect(getAccessToken()).toBe("access-nuevo");
    expect(getRefreshToken()).toBe("refresh-nuevo");
  });

  it("dispara sesión expirada si el refresh falla", async () => {
    setTokens({ accessToken: "access-vencido", refreshToken: "refresh-ko" });
    const onExpirada = vi.fn();
    setManejadorSesionExpirada(onExpirada);

    server.use(
      http.get(`${API}/protegido`, () => {
        return HttpResponse.json({ error: "unauthorized" }, { status: 401 });
      }),
      http.post(`${API}/autenticacion/renovar-sesion`, () => {
        return HttpResponse.json({ error: "invalid" }, { status: 401 });
      }),
    );

    await expect(clienteApi.get("/protegido")).rejects.toBeTruthy();
    expect(onExpirada).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });
});
