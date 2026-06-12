import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listarAuditoria } from "../services/admin.service";
import PaginaCarga from "../components/shared/PaginaCarga";
import MensajeError from "../components/shared/MensajeError";
import TablaPaginada from "../components/shared/TablaPaginada";

function sanitizar(valor) {
  const texto = JSON.stringify(valor ?? "", null, 0);
  return texto
    .replace(
      /(token|password|contrasena|secret|authorization)"\s*:\s*"[^"]*"/gi,
      '$1":"[REDACTADO]"',
    )
    .replace(/(Bearer\s+)[A-Za-z0-9-_.]+/g, "$1[REDACTADO]");
}

export default function AuditoriaPage() {
  const [usuarioId, setUsuarioId] = useState("");
  const auditQ = useQuery({
    queryKey: ["auditoria", usuarioId],
    queryFn: () =>
      listarAuditoria({
        usuarioId: usuarioId || undefined,
        pagina: 1,
        tamano: 50,
      }),
  });

  if (auditQ.isLoading) return <PaginaCarga mensaje="Cargando auditoría..." />;
  if (auditQ.error) return <MensajeError error={auditQ.error} />;

  const filas = auditQ.data?.items || auditQ.data?.auditoria || [];

  return (
    <section className="seccion-admin">
      <header className="seccion-admin__header">
        <h2>Auditoría</h2>
        <input
          placeholder="Filtrar por usuario ID"
          value={usuarioId}
          onChange={(e) => setUsuarioId(e.target.value)}
        />
      </header>
      <TablaPaginada
        columnas={[
          { key: "fecha", label: "Fecha" },
          { key: "usuarioId", label: "Usuario" },
          { key: "entidad", label: "Entidad" },
          { key: "accion", label: "Acción" },
          { key: "identificador", label: "Identificador" },
          {
            key: "cambios",
            label: "Cambios",
            render: (_v, fila) => (
              <details>
                <summary>Ver</summary>
                <pre className="codigo-panel">
                  {sanitizar({ antes: fila.antes, despues: fila.despues })}
                </pre>
              </details>
            ),
          },
        ]}
        filas={filas}
      />
    </section>
  );
}
