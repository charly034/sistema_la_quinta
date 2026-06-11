import { especificacionOpenAPI } from "../documentacion/openapi.js";

describe("Etapa 4 - OpenAPI", () => {
  it("incluye endpoints de reglas, perfiles y propuestas", () => {
    const paths = especificacionOpenAPI.paths;

    expect(paths["/menu/reglas"].get).toBeDefined();
    expect(paths["/menu/reglas"].post).toBeDefined();
    expect(paths["/menu/reglas/{id}"].get).toBeDefined();
    expect(paths["/menu/reglas/{id}"].patch).toBeDefined();
    expect(paths["/menu/reglas/{id}/estado"].patch).toBeDefined();
    expect(paths["/menu/reglas/{id}/duplicar"].post).toBeDefined();
    expect(paths["/menu/reglas/evaluar"].post).toBeDefined();

    expect(paths["/menu/perfiles-reglas"].get).toBeDefined();
    expect(paths["/menu/perfiles-reglas"].post).toBeDefined();
    expect(paths["/menu/perfiles-reglas/{id}"].get).toBeDefined();
    expect(paths["/menu/perfiles-reglas/{id}"].patch).toBeDefined();
    expect(paths["/menu/perfiles-reglas/{id}/estado"].patch).toBeDefined();
    expect(paths["/menu/perfiles-reglas/{id}/reglas"].put).toBeDefined();
    expect(paths["/menu/perfiles-reglas/{id}/duplicar"].post).toBeDefined();

    expect(
      paths["/menu/semanas/{id}/versiones/{versionId}/propuestas/generar"].post,
    ).toBeDefined();
    expect(
      paths[
        "/menu/semanas/{id}/versiones/{versionId}/propuestas/generar-personalizada"
      ].post,
    ).toBeDefined();
    expect(
      paths["/menu/semanas/{id}/versiones/{versionId}/propuestas"].get,
    ).toBeDefined();
    expect(
      paths["/menu/semanas/{id}/versiones/{versionId}/propuestas/{propuestaId}"]
        .get,
    ).toBeDefined();
    expect(
      paths[
        "/menu/semanas/{id}/versiones/{versionId}/propuestas/{propuestaId}/aprobar"
      ].post,
    ).toBeDefined();
    expect(
      paths[
        "/menu/semanas/{id}/versiones/{versionId}/propuestas/{propuestaId}/descartar"
      ].post,
    ).toBeDefined();
    expect(
      paths[
        "/menu/semanas/{id}/versiones/{versionId}/propuestas/{propuestaId}/aplicar"
      ].post,
    ).toBeDefined();
  });
});
