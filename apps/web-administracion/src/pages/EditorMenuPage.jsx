import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import {
  aplicarPropuesta,
  generarPropuestas,
  listarPropuestas,
} from "../services/propuestas.service";
import {
  obtenerMensajeWhatsapp,
  obtenerSemana,
  descargarExcel,
} from "../services/menus.service";
import PaginaCarga from "../components/shared/PaginaCarga";
import MensajeError from "../components/shared/MensajeError";
import ModalConfirmacion from "../components/shared/ModalConfirmacion";
import CopiarTexto from "../components/shared/CopiarTexto";
import DescargaArchivo from "../components/shared/DescargaArchivo";
import { descargarBlob, obtenerNombreDescarga } from "../utils/archivos";

const DIAS = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
];

export default function EditorMenuPage() {
  const { semanaId, versionId } = useParams();
  const queryClient = useQueryClient();
  const [confirmarAplicacion, setConfirmarAplicacion] = useState(null);

  const semanaQ = useQuery({
    queryKey: ["semana", semanaId],
    queryFn: () => obtenerSemana(semanaId),
    enabled: Boolean(semanaId),
  });
  const propuestasQ = useQuery({
    queryKey: ["propuestas", semanaId, versionId],
    queryFn: () =>
      listarPropuestas(semanaId, versionId, { pagina: 1, limite: 20 }),
    enabled: Boolean(semanaId && versionId),
  });

  const generarM = useMutation({
    mutationFn: () =>
      generarPropuestas(semanaId, versionId, {
        generar_perfiles_iniciales: true,
        respetar_platos_existentes: false,
        solo_posiciones_vacias: false,
        variar_resultados: false,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["propuestas", semanaId, versionId],
      }),
  });

  const aplicarM = useMutation({
    mutationFn: (propuestaId) =>
      aplicarPropuesta(semanaId, versionId, propuestaId),
    onSuccess: () => {
      setConfirmarAplicacion(null);
      queryClient.invalidateQueries({ queryKey: ["semana", semanaId] });
      queryClient.invalidateQueries({
        queryKey: ["propuestas", semanaId, versionId],
      });
    },
  });

  const excelM = useMutation({
    mutationFn: async () => {
      const response = await descargarExcel(semanaId, { versionId });
      const fileName = obtenerNombreDescarga(
        response.headers,
        `menu-${semanaId}.xlsx`,
      );
      descargarBlob(response.data, fileName);
    },
  });

  const whatsappQ = useQuery({
    queryKey: ["whatsapp", semanaId, versionId],
    queryFn: () => obtenerMensajeWhatsapp(semanaId, { versionId }),
    enabled: Boolean(semanaId),
  });

  if (semanaQ.isLoading)
    return <PaginaCarga mensaje="Cargando editor semanal..." />;
  if (semanaQ.error) return <MensajeError error={semanaQ.error} />;

  const version =
    semanaQ.data?.versionActual || semanaQ.data?.versionPublicada || {};
  const dias = version?.dias || [];
  const propuestas =
    propuestasQ.data?.items || propuestasQ.data?.propuestas || [];

  return (
    <section className="seccion-admin editor-semanal">
      <header className="seccion-admin__header">
        <h2>Editor semanal</h2>
        <div className="acciones-fila">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => generarM.mutate()}
            disabled={generarM.isPending}
          >
            {generarM.isPending ? "Generando..." : "Generar propuestas"}
          </button>
          <DescargaArchivo
            descargando={excelM.isPending}
            onDescargar={() => excelM.mutate()}
            texto="Descargar Excel"
          />
        </div>
      </header>

      {generarM.error ? (
        <MensajeError
          error={generarM.error}
          titulo="No se pudieron generar propuestas"
        />
      ) : null}

      {aplicarM.error ? (
        <MensajeError
          error={aplicarM.error}
          titulo="No se pudo aplicar la propuesta"
        />
      ) : null}

      <div
        className="matriz-semanal"
        role="region"
        aria-label="Editor de menú semanal"
      >
        <table>
          <thead>
            <tr>
              <th>Opción / Día</th>
              {DIAS.map((dia) => (
                <th key={dia}>{dia}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {["A", "B", "C"].map((opcion) => (
              <tr key={opcion}>
                <td>Opción {opcion}</td>
                {DIAS.map((dia) => {
                  const celda =
                    dias.find((d) =>
                      String(d.fecha || "")
                        .toLowerCase()
                        .includes(dia),
                    ) || {};
                  const opciones = celda.opciones || [];
                  const item = opciones.find(
                    (opt) =>
                      opt.codigo === opcion || opt.ordenVisual === opcion,
                  );
                  return (
                    <td key={`${opcion}-${dia}`}>
                      <strong>{item?.platoNombre || "Sin plato"}</strong>
                      <small>
                        {item?.bloqueada ? "Bloqueada" : "Editable"}
                      </small>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="panel-detalle">
        <header>
          <h3>Comparador de propuestas</h3>
        </header>
        <div className="comparador-propuestas">
          {propuestas.map((p) => (
            <article key={p.id} className="columna-propuesta">
              <h4>{p.tipo || p.nombre || "Propuesta"}</h4>
              <p>Puntaje: {p.puntajeTotal ?? "-"}</p>
              <p>Semilla: {p.semilla ?? "-"}</p>
              <p>Estado: {p.estado ?? "-"}</p>
              <p>Podas: {p.metricas?.podas ?? "-"}</p>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setConfirmarAplicacion(p.id)}
              >
                Aplicar
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="panel-detalle">
        <header>
          <h3>Vista previa de WhatsApp</h3>
        </header>
        {whatsappQ.isLoading ? (
          <PaginaCarga mensaje="Generando vista previa..." />
        ) : null}
        {whatsappQ.error ? (
          <MensajeError
            error={whatsappQ.error}
            titulo="No se pudo generar WhatsApp"
          />
        ) : null}
        {whatsappQ.data ? (
          <>
            <pre className="vista-whatsapp">
              {whatsappQ.data?.mensaje ||
                whatsappQ.data?.contenido ||
                "Sin contenido"}
            </pre>
            <CopiarTexto
              contenido={
                whatsappQ.data?.mensaje || whatsappQ.data?.contenido || ""
              }
              etiqueta="Copiar mensaje"
            />
          </>
        ) : null}
      </section>

      <ModalConfirmacion
        abierto={Boolean(confirmarAplicacion)}
        titulo="Aplicar propuesta"
        descripcion="Esta acción reemplazará posiciones no bloqueadas en la versión actual. ¿Deseás continuar?"
        onCancelar={() => setConfirmarAplicacion(null)}
        onConfirmar={() => aplicarM.mutate(confirmarAplicacion)}
        textoConfirmar="Aplicar propuesta"
      />
    </section>
  );
}
