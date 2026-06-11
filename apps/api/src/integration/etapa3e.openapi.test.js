import request from "supertest";
import { createApp } from "../app.js";
import { especificacionOpenAPI } from "../documentacion/openapi.js";

describe("Etapa 3E - OpenAPI", () => {
  it("incluye las operaciones definitivas de menús semanales", () => {
    const paths = especificacionOpenAPI.paths;

    expect(paths["/menu/semanas"]).toBeDefined();
    expect(paths["/menu/semanas"].get).toBeDefined();
    expect(paths["/menu/semanas"].post).toBeDefined();

    expect(paths["/menu/semanas/{id}"]).toBeDefined();
    expect(paths["/menu/semanas/{id}"].get).toBeDefined();
    expect(paths["/menu/semanas/{id}"].patch).toBeDefined();

    expect(paths["/menu/semanas/{id}/duplicar"].post).toBeDefined();
    expect(paths["/menu/semanas/{id}/versiones"].get).toBeDefined();
    expect(paths["/menu/semanas/{id}/versiones"].post).toBeDefined();
    expect(paths["/menu/semanas/{id}/versiones/{versionId}"].get).toBeDefined();
    expect(paths["/menu/semanas/{id}/versiones/{versionId}"].put).toBeDefined();
    expect(
      paths["/menu/semanas/{id}/versiones/{versionId}/dias/{fecha}"].put,
    ).toBeDefined();
    expect(
      paths["/menu/semanas/{id}/versiones/{versionId}/dias/{fecha}/opciones"]
        .put,
    ).toBeDefined();
    expect(
      paths["/menu/semanas/{id}/versiones/{versionId}/proponer"].post,
    ).toBeDefined();
    expect(
      paths["/menu/semanas/{id}/versiones/{versionId}/aprobar"].post,
    ).toBeDefined();
    expect(
      paths["/menu/semanas/{id}/versiones/{versionId}/publicar"].post,
    ).toBeDefined();
    expect(
      paths["/menu/semanas/{id}/versiones/{versionId}/finalizar"].post,
    ).toBeDefined();
    expect(
      paths["/menu/semanas/{id}/versiones/{versionId}/cancelar"].post,
    ).toBeDefined();
    expect(paths["/menu/semanas/{id}/mensaje-whatsapp"].get).toBeDefined();
    expect(paths["/menu/semanas/{id}/exportar/texto"].get).toBeDefined();
    expect(paths["/menu/semanas/{id}/exportar/excel"].get).toBeDefined();
    expect(paths["/menu/platos/{id}/historial-uso"].get).toBeDefined();
  });

  it("expone Swagger en runtime", async () => {
    const app = createApp();
    const res = await request(app).get("/api/v1/documentacion/");
    expect(res.status).toBe(200);
  });
});
