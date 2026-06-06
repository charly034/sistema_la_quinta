import { useRef, useState } from "react";
import Swal from "sweetalert2";

const emptyForm = {
  empleadoId: "",
  fecha: "",
  tipo: "efectivo",
  monto: "",
  peso: "",
  cantidad: "",
  mercaderia: "",
  nuevaMercaderia: "",
  motivo: "",
};

function AdelantosContainer({
  adelantos,
  empleados,
  mercaderias,
  onAddAdelanto,
  onUpdateAdelanto,
  onDeleteAdelanto,
  onAddMercaderia,
  canCreate,
  canEdit,
  canDelete,
}) {
  const [form, setForm] = useState(emptyForm);
  const idRef = useRef(1000);
  const toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canCreate) {
      return;
    }
    if (!form.empleadoId || !form.fecha || !form.motivo || !form.tipo) {
      return;
    }

    if (form.tipo === "efectivo" && !form.monto) {
      return;
    }

    if (form.tipo === "mercaderia" && !form.peso && !form.cantidad) {
      return;
    }

    if (
      form.tipo === "mercaderia" &&
      !form.mercaderia &&
      !form.nuevaMercaderia
    ) {
      return;
    }

    const empleadoSeleccionado = empleados.find(
      (empleado) => empleado.id === form.empleadoId,
    );

    const mercaderiaSeleccionada =
      form.tipo === "mercaderia"
        ? form.nuevaMercaderia?.trim() || form.mercaderia
        : "";

    if (form.tipo === "mercaderia" && form.nuevaMercaderia?.trim()) {
      onAddMercaderia(form.nuevaMercaderia);
    }

    const nuevoAdelanto = {
      id: `AD-${(idRef.current += 1)}`,
      empleadoId: form.empleadoId,
      empleadoNombre: empleadoSeleccionado?.nombre ?? "Empleado",
      fecha: form.fecha,
      tipo: form.tipo,
      monto: form.tipo === "efectivo" ? Number(form.monto) : 0,
      peso: form.tipo === "mercaderia" ? Number(form.peso || 0) : 0,
      cantidad: form.tipo === "mercaderia" ? Number(form.cantidad || 0) : 0,
      mercaderia: mercaderiaSeleccionada,
      motivo: form.motivo,
      estado: "Pendiente",
    };

    onAddAdelanto(nuevoAdelanto);
    setForm(emptyForm);
    toast.fire({ icon: "success", title: "Adelanto creado" });
  };

  const handleDelete = async (adelantoId) => {
    const result = await Swal.fire({
      title: "¿Eliminar adelanto?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#7c3aed",
    });

    if (result.isConfirmed) {
      onDeleteAdelanto(adelantoId);
      toast.fire({ icon: "success", title: "Adelanto eliminado" });
    }
  };

  const handleEdit = async (adelanto) => {
    const empleadosOptions = empleados
      .map(
        (empleado) =>
          `<option value="${empleado.id}" ${
            empleado.id === adelanto.empleadoId ? "selected" : ""
          }>${empleado.nombre}</option>`,
      )
      .join("");

    const mercaderiasOptions = mercaderias
      .map(
        (item) =>
          `<option value="${item}" ${
            item === adelanto.mercaderia ? "selected" : ""
          }>${item}</option>`,
      )
      .join("");

    const result = await Swal.fire({
      title: "Modificar adelanto",
      html: `
        <div class="swal-form">
          <label for="swal-empleado">Empleado</label>
          <select id="swal-empleado" class="swal2-select">
            ${empleadosOptions}
          </select>
          <label for="swal-fecha">Fecha</label>
          <input id="swal-fecha" class="swal2-input" type="date" value="${adelanto.fecha}" />
          <label for="swal-tipo">Tipo</label>
          <select id="swal-tipo" class="swal2-select">
            <option value="efectivo" ${adelanto.tipo === "efectivo" ? "selected" : ""}>Efectivo</option>
            <option value="mercaderia" ${adelanto.tipo === "mercaderia" ? "selected" : ""}>Mercadería</option>
          </select>
          <label for="swal-mercaderia">Mercadería</label>
          <select id="swal-mercaderia" class="swal2-select">
            <option value="">Seleccionar</option>
            ${mercaderiasOptions}
          </select>
          <label for="swal-nueva-mercaderia">Nueva mercadería</label>
          <input id="swal-nueva-mercaderia" class="swal2-input" placeholder="Si no está en la lista" />
          <label for="swal-monto">Monto</label>
          <input id="swal-monto" class="swal2-input" type="number" min="0" value="${adelanto.monto}" />
          <label for="swal-peso">Peso (kg)</label>
          <input id="swal-peso" class="swal2-input" type="number" min="0" value="${adelanto.peso ?? 0}" />
          <label for="swal-cantidad">Cantidad</label>
          <input id="swal-cantidad" class="swal2-input" type="number" min="0" value="${adelanto.cantidad ?? 0}" />
          <label for="swal-motivo">Motivo</label>
          <input id="swal-motivo" class="swal2-input" value="${adelanto.motivo}" />
          <label for="swal-estado">Estado</label>
          <select id="swal-estado" class="swal2-select">
            <option value="Pendiente" ${adelanto.estado === "Pendiente" ? "selected" : ""}>Pendiente</option>
            <option value="Aprobado" ${adelanto.estado === "Aprobado" ? "selected" : ""}>Aprobado</option>
            <option value="Pagado" ${adelanto.estado === "Pagado" ? "selected" : ""}>Pagado</option>
          </select>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Guardar cambios",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#7c3aed",
      preConfirm: () => {
        const popup = Swal.getPopup();
        const empleadoId = popup.querySelector("#swal-empleado")?.value;
        const fecha = popup.querySelector("#swal-fecha")?.value;
        const tipo = popup.querySelector("#swal-tipo")?.value;
        const mercaderia = popup.querySelector("#swal-mercaderia")?.value;
        const nuevaMercaderia = popup
          .querySelector("#swal-nueva-mercaderia")
          ?.value?.trim();
        const monto = popup.querySelector("#swal-monto")?.value;
        const peso = popup.querySelector("#swal-peso")?.value;
        const cantidad = popup.querySelector("#swal-cantidad")?.value;
        const motivo = popup.querySelector("#swal-motivo")?.value?.trim();
        const estado = popup.querySelector("#swal-estado")?.value;

        if (!empleadoId || !fecha || !motivo || !estado || !tipo) {
          Swal.showValidationMessage("Completa todos los campos");
          return null;
        }

        if (tipo === "efectivo" && !monto) {
          Swal.showValidationMessage("Ingresa el monto en efectivo");
          return null;
        }

        if (tipo === "mercaderia" && !peso && !cantidad) {
          Swal.showValidationMessage(
            "Indica el peso o la cantidad de productos",
          );
          return null;
        }

        if (tipo === "mercaderia" && !mercaderia && !nuevaMercaderia) {
          Swal.showValidationMessage("Selecciona o agrega una mercadería");
          return null;
        }

        const empleadoExiste = empleados.some(
          (empleado) => empleado.id === empleadoId,
        );

        if (!empleadoExiste) {
          Swal.showValidationMessage("El empleado seleccionado ya no existe");
          return null;
        }

        if (tipo === "mercaderia" && nuevaMercaderia) {
          onAddMercaderia(nuevaMercaderia);
        }

        return {
          empleadoId,
          fecha,
          tipo,
          monto: tipo === "efectivo" ? Number(monto) : 0,
          peso: tipo === "mercaderia" ? Number(peso || 0) : 0,
          cantidad: tipo === "mercaderia" ? Number(cantidad || 0) : 0,
          mercaderia:
            tipo === "mercaderia" ? nuevaMercaderia || mercaderia : "",
          motivo,
          estado,
        };
      },
    });

    if (result.isConfirmed && result.value) {
      onUpdateAdelanto({ id: adelanto.id, ...result.value });
      toast.fire({ icon: "success", title: "Adelanto actualizado" });
    }
  };

  const getDetalleMercaderia = (adelanto) => {
    const parts = [];
    if (adelanto.mercaderia) {
      parts.push(adelanto.mercaderia);
    }
    if (adelanto.peso) {
      parts.push(`${adelanto.peso} kg`);
    }
    if (adelanto.cantidad) {
      parts.push(`${adelanto.cantidad} prod.`);
    }
    return parts.join(" · ");
  };

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <p className="panel__title">Adelantos</p>
          <p className="panel__subtitle">Solicitudes recientes y estado</p>
        </div>
        <span className="badge">Últimos 30 días</span>
      </header>

      <form className="form" onSubmit={handleSubmit}>
        <div className="form__group">
          <label htmlFor="empleadoId">Empleado</label>
          <select
            id="empleadoId"
            name="empleadoId"
            value={form.empleadoId}
            onChange={handleChange}
            disabled={!canCreate}
          >
            <option value="">Seleccionar</option>
            {empleados.map((empleado) => (
              <option key={empleado.id} value={empleado.id}>
                {empleado.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="form__group">
          <label htmlFor="fecha">Fecha</label>
          <input
            type="date"
            id="fecha"
            name="fecha"
            value={form.fecha}
            onChange={handleChange}
            disabled={!canCreate}
          />
        </div>
        <div className="form__group">
          <label htmlFor="tipo">Tipo</label>
          <select
            id="tipo"
            name="tipo"
            value={form.tipo}
            onChange={handleChange}
            disabled={!canCreate}
          >
            <option value="efectivo">Efectivo</option>
            <option value="mercaderia">Mercadería</option>
          </select>
        </div>
        {form.tipo === "efectivo" && (
          <div className="form__group">
            <label htmlFor="monto">Monto</label>
            <input
              type="number"
              id="monto"
              name="monto"
              placeholder="0"
              value={form.monto}
              onChange={handleChange}
              min="0"
              disabled={!canCreate}
            />
          </div>
        )}
        {form.tipo === "mercaderia" && (
          <>
            <div className="form__group">
              <label htmlFor="mercaderia">Mercadería</label>
              <select
                id="mercaderia"
                name="mercaderia"
                value={form.mercaderia}
                onChange={handleChange}
                disabled={!canCreate}
              >
                <option value="">Seleccionar</option>
                {mercaderias.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div className="form__group">
              <label htmlFor="nuevaMercaderia">Nueva mercadería</label>
              <input
                type="text"
                id="nuevaMercaderia"
                name="nuevaMercaderia"
                placeholder="Si no está en la lista"
                value={form.nuevaMercaderia}
                onChange={handleChange}
                disabled={!canCreate}
              />
            </div>
            <div className="form__group">
              <label htmlFor="peso">Peso (kg)</label>
              <input
                type="number"
                id="peso"
                name="peso"
                placeholder="0"
                value={form.peso}
                onChange={handleChange}
                min="0"
                disabled={!canCreate}
              />
            </div>
            <div className="form__group">
              <label htmlFor="cantidad">Cantidad</label>
              <input
                type="number"
                id="cantidad"
                name="cantidad"
                placeholder="0"
                value={form.cantidad}
                onChange={handleChange}
                min="0"
                disabled={!canCreate}
              />
            </div>
          </>
        )}
        <div className="form__group form__group--full">
          <label htmlFor="motivo">Motivo</label>
          <input
            type="text"
            id="motivo"
            name="motivo"
            placeholder="Detalle de la solicitud"
            value={form.motivo}
            onChange={handleChange}
            disabled={!canCreate}
          />
        </div>
        <button
          className="btn btn--primary"
          type="submit"
          disabled={!canCreate}
        >
          Registrar adelanto
        </button>
      </form>

      {!canCreate && (
        <p className="form__hint">
          No tienes permisos para registrar nuevos adelantos.
        </p>
      )}

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Empleado</th>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Detalle</th>
              <th className="table__amount">Monto</th>
              <th>Estado</th>
              {(canDelete || canEdit) && (
                <th className="table__actions">Acciones</th>
              )}
            </tr>
          </thead>
          <tbody>
            {adelantos.map((adelanto) => (
              <tr key={adelanto.id}>
                <td>
                  <p className="table__primary">{adelanto.empleadoNombre}</p>
                  <p className="table__secondary">{adelanto.id}</p>
                </td>
                <td>{new Date(adelanto.fecha).toLocaleDateString("es-AR")}</td>
                <td>
                  {adelanto.tipo === "mercaderia" ? "Mercadería" : "Efectivo"}
                </td>
                <td>
                  {adelanto.tipo === "mercaderia"
                    ? getDetalleMercaderia(adelanto)
                    : adelanto.motivo}
                </td>
                <td className="table__amount">
                  {adelanto.tipo === "efectivo"
                    ? new Intl.NumberFormat("es-AR", {
                        style: "currency",
                        currency: "ARS",
                        maximumFractionDigits: 0,
                      }).format(adelanto.monto)
                    : "-"}
                </td>
                <td>
                  <span
                    className={`status status--${adelanto.estado.toLowerCase()}`}
                  >
                    {adelanto.estado}
                  </span>
                </td>
                {(canDelete || canEdit) && (
                  <td className="table__actions">
                    {canEdit && (
                      <button
                        type="button"
                        className="btn btn--ghost btn--info"
                        onClick={() => handleEdit(adelanto)}
                      >
                        Editar
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        className="btn btn--ghost btn--danger"
                        onClick={() => handleDelete(adelanto.id)}
                      >
                        Eliminar
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default AdelantosContainer;
