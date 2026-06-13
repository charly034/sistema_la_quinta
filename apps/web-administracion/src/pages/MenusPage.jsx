import React, { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../auth/AuthProvider";
import { puedeGestionarMenus } from "../utils/permisos";
import { listarSemanas, crearSemana } from "../services/menus.service";
import {
  listarMarcas,
  listarCanales,
  listarEmpresas,
} from "../services/admin.service";
import PaginaCarga from "../components/shared/PaginaCarga";
import MensajeError from "../components/shared/MensajeError";
import PaginaVacia from "../components/shared/PaginaVacia";
import TablaPaginada from "../components/shared/TablaPaginada";
import BarraFiltros from "../components/shared/BarraFiltros";
import {
  SelectorMarca,
  SelectorCanal,
  SelectorEmpresa,
  SelectorEstado,
} from "../components/shared/Selectores";

function esLunesIso(fechaIso) {
  if (!fechaIso) return false;
  const d = new Date(`${fechaIso}T00:00:00Z`);
  return d.getUTCDay() === 1;
}

function filtrarEmpresasPorMarca(empresas, marcaId) {
  if (!marcaId) return empresas;
  return empresas.filter((empresa) => {
    if (empresa?.marcaId === marcaId || empresa?.marca_id === marcaId) {
      return true;
    }
    if (Array.isArray(empresa?.marcas)) {
      return empresa.marcas.some(
        (marca) => marca?.id === marcaId || marca?.marcaId === marcaId,
      );
    }
    if (Array.isArray(empresa?.marcasIds)) {
      return empresa.marcasIds.includes(marcaId);
    }
    return true;
  });
}

export default function MenusPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { usuario } = useAuth();
  const puedeCrearSemana = puedeGestionarMenus(usuario);
  const primerCampoRef = useRef(null);
  const [marcaId, setMarcaId] = useState();
  const [canalId, setCanalId] = useState();
  const [empresaId, setEmpresaId] = useState();
  const [estado, setEstado] = useState();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [formData, setFormData] = useState({
    marcaId: "",
    canalId: "",
    empresaId: "",
    fechaInicio: "",
  });
  const [errores, setErrores] = useState({});

  const filtros = useMemo(
    () => ({ pagina: 1, limite: 20, marcaId, canalId, empresaId, estado }),
    [marcaId, canalId, empresaId, estado],
  );

  const semanasQ = useQuery({
    queryKey: ["semanas", filtros],
    queryFn: () => listarSemanas(filtros),
  });
  const marcasQ = useQuery({
    queryKey: ["marcas-base"],
    queryFn: () => listarMarcas({ pagina: 1, tamano: 100 }),
  });
  const canalesQ = useQuery({
    queryKey: ["canales-base"],
    queryFn: () => listarCanales({ pagina: 1, tamano: 100 }),
  });
  const empresasQ = useQuery({
    queryKey: ["empresas-base"],
    queryFn: () => listarEmpresas({ pagina: 1, tamano: 100 }),
  });

  const crearSemanaM = useMutation({
    mutationFn: crearSemana,
    onSuccess: (resultado) => {
      const semanaCreada = resultado?.semana;
      const versionInicial = resultado?.versionInicial;
      toast.success("Semana creada correctamente.");
      setModalAbierto(false);
      setErrores({});
      setFormData({ marcaId: "", canalId: "", empresaId: "", fechaInicio: "" });
      queryClient.invalidateQueries({ queryKey: ["semanas"] });
      navigate(`/menus/${semanaCreada?.id}/versiones/${versionInicial?.id}`);
    },
    onError: (error) => {
      setErrores((actual) => ({
        ...actual,
        submit: error?.message || "No pudimos crear la semana.",
      }));
    },
  });

  useEffect(() => {
    if (modalAbierto) {
      primerCampoRef.current?.focus();
    }
  }, [modalAbierto]);

  const marcas =
    marcasQ.data?.items || marcasQ.data?.marcas || marcasQ.data || [];
  const canales =
    canalesQ.data?.items || canalesQ.data?.canales || canalesQ.data || [];
  const empresas =
    empresasQ.data?.items || empresasQ.data?.empresas || empresasQ.data || [];
  const empresasFiltradas = filtrarEmpresasPorMarca(empresas, formData.marcaId);

  function abrirModal() {
    setErrores({});
    setModalAbierto(true);
  }

  function cerrarModal() {
    if (crearSemanaM.isPending) return;
    setModalAbierto(false);
    setErrores({});
  }

  function actualizarCampo(campo, valor) {
    setFormData((actual) => {
      const siguiente = { ...actual, [campo]: valor };
      if (campo === "marcaId" && actual.marcaId !== valor) {
        siguiente.empresaId = "";
      }
      return siguiente;
    });
    setErrores((actual) => ({
      ...actual,
      [campo]: undefined,
      submit: undefined,
    }));
  }

  function validarFormulario() {
    const siguientes = {};
    if (!formData.marcaId) siguientes.marcaId = "La marca es obligatoria.";
    if (!formData.fechaInicio) {
      siguientes.fechaInicio = "La fecha de inicio es obligatoria.";
    } else if (!esLunesIso(formData.fechaInicio)) {
      siguientes.fechaInicio = "La fecha de inicio debe ser un lunes.";
    }
    return siguientes;
  }

  function enviarFormulario(event) {
    event.preventDefault();
    if (crearSemanaM.isPending) return;
    const siguientesErrores = validarFormulario();
    if (Object.keys(siguientesErrores).length > 0) {
      setErrores(siguientesErrores);
      return;
    }

    crearSemanaM.mutate({
      marcaId: formData.marcaId,
      canalId: formData.canalId || null,
      empresaId: formData.empresaId || null,
      fechaInicio: formData.fechaInicio,
    });
  }

  if (
    semanasQ.isLoading ||
    marcasQ.isLoading ||
    canalesQ.isLoading ||
    empresasQ.isLoading
  ) {
    return <PaginaCarga mensaje="Cargando semanas..." />;
  }
  if (semanasQ.error) return <MensajeError error={semanasQ.error} />;

  const semanas = semanasQ.data?.semanas || [];

  return (
    <section className="seccion-admin">
      <header className="seccion-admin__header">
        <h2>Menús semanales</h2>
        {puedeCrearSemana ? (
          <button
            type="button"
            className="btn btn--primary"
            onClick={abrirModal}
            aria-label="Crear semana"
          >
            Crear semana
          </button>
        ) : null}
      </header>
      <BarraFiltros>
        <SelectorMarca marcas={marcas} value={marcaId} onChange={setMarcaId} />
        <SelectorCanal
          canales={canales}
          value={canalId}
          onChange={setCanalId}
        />
        <SelectorEmpresa
          empresas={empresas}
          value={empresaId}
          onChange={setEmpresaId}
        />
        <SelectorEstado
          estados={[
            "BORRADOR",
            "PROPUESTO",
            "APROBADO",
            "PUBLICADO",
            "FINALIZADO",
            "CANCELADO",
          ]}
          value={estado}
          onChange={setEstado}
        />
      </BarraFiltros>

      {semanas.length === 0 ? (
        <PaginaVacia
          titulo="Sin semanas"
          descripcion="No hay semanas para los filtros seleccionados."
        />
      ) : (
        <TablaPaginada
          columnas={[
            { key: "fechaInicio", label: "Fecha" },
            { key: "marcaNombre", label: "Marca" },
            { key: "canalNombre", label: "Canal" },
            { key: "empresaNombre", label: "Empresa" },
            { key: "estadoActual", label: "Estado actual" },
            { key: "estadoPublicado", label: "Estado publicado" },
          ]}
          filas={semanas}
          renderAcciones={(fila) => (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() =>
                navigate(
                  `/menus/${fila.id}/versiones/${fila.versionActual?.id || fila.versionId || ""}`,
                )
              }
            >
              Ver / Editar
            </button>
          )}
        />
      )}

      {modalAbierto ? (
        <div
          className="modal-fondo"
          role="dialog"
          aria-modal="true"
          aria-labelledby="crear-semana-titulo"
        >
          <div className="modal-contenido modal-contenido--formulario">
            <h3 id="crear-semana-titulo">Crear semana</h3>
            <form className="modal-formulario" onSubmit={enviarFormulario}>
              <label className="campo">
                <span className="campo__label">Marca</span>
                <select
                  ref={primerCampoRef}
                  value={formData.marcaId}
                  onChange={(event) =>
                    actualizarCampo("marcaId", event.target.value)
                  }
                  aria-invalid={Boolean(errores.marcaId)}
                >
                  <option value="">Seleccionar marca</option>
                  {marcas.map((marca) => (
                    <option key={marca.id} value={marca.id}>
                      {marca.nombre}
                    </option>
                  ))}
                </select>
                {errores.marcaId ? (
                  <p className="error-inline">{errores.marcaId}</p>
                ) : null}
              </label>

              <label className="campo">
                <span className="campo__label">Canal</span>
                <select
                  value={formData.canalId}
                  onChange={(event) =>
                    actualizarCampo("canalId", event.target.value)
                  }
                >
                  <option value="">Sin canal</option>
                  {canales.map((canal) => (
                    <option key={canal.id} value={canal.id}>
                      {canal.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label className="campo">
                <span className="campo__label">Empresa</span>
                <select
                  value={formData.empresaId}
                  onChange={(event) =>
                    actualizarCampo("empresaId", event.target.value)
                  }
                >
                  <option value="">Sin empresa</option>
                  {empresasFiltradas.map((empresa) => (
                    <option key={empresa.id} value={empresa.id}>
                      {empresa.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label className="campo">
                <span className="campo__label">Fecha de inicio</span>
                <input
                  type="date"
                  value={formData.fechaInicio}
                  onChange={(event) =>
                    actualizarCampo("fechaInicio", event.target.value)
                  }
                  aria-invalid={Boolean(errores.fechaInicio)}
                />
                {errores.fechaInicio ? (
                  <p className="error-inline">{errores.fechaInicio}</p>
                ) : null}
              </label>

              {errores.submit ? (
                <MensajeError
                  error={{ message: errores.submit }}
                  titulo="No se pudo crear la semana"
                />
              ) : null}

              <div className="modal-acciones">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={cerrarModal}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={crearSemanaM.isPending}
                >
                  {crearSemanaM.isPending ? "Creando..." : "Guardar semana"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
