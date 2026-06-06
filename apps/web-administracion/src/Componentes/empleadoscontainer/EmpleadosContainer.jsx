import { useRef, useState } from "react";
import Swal from "sweetalert2";

const emptyForm = {
  nombre: "",
  puesto: "",
  telefono: "",
};

function EmpleadosContainer({
  empleados,
  onAddEmpleado,
  onUpdateEmpleado,
  onDeleteEmpleado,
  canManage,
  canEdit,
}) {
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
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
    if (!canManage) {
      return;
    }

    if (!form.nombre || !form.puesto || !form.telefono) {
      return;
    }

    const nuevoEmpleado = {
      id: `EMP-${(idRef.current += 1)}`,
      nombre: form.nombre,
      puesto: form.puesto,
      telefono: form.telefono,
    };

    onAddEmpleado(nuevoEmpleado);
    setForm(emptyForm);
    toast.fire({ icon: "success", title: "Empleado creado" });
  };

  const handleDelete = async (empleadoId) => {
    const result = await Swal.fire({
      title: "¿Eliminar empleado?",
      text: "Se eliminarán también sus adelantos.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#7c3aed",
    });

    if (result.isConfirmed) {
      onDeleteEmpleado(empleadoId);
      toast.fire({ icon: "success", title: "Empleado eliminado" });
    }
  };

  const handleEdit = async (empleado) => {
    const result = await Swal.fire({
      title: "Modificar empleado",
      html: `
        <div class="swal-form">
          <label for="swal-nombre">Nombre</label>
          <input id="swal-nombre" class="swal2-input" value="${empleado.nombre}" />
          <label for="swal-puesto">Puesto</label>
          <input id="swal-puesto" class="swal2-input" value="${empleado.puesto}" />
          <label for="swal-telefono">Teléfono</label>
          <input id="swal-telefono" class="swal2-input" value="${empleado.telefono}" />
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Guardar cambios",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#7c3aed",
      preConfirm: () => {
        const popup = Swal.getPopup();
        const nombre = popup.querySelector("#swal-nombre")?.value?.trim();
        const puesto = popup.querySelector("#swal-puesto")?.value?.trim();
        const telefono = popup.querySelector("#swal-telefono")?.value?.trim();

        if (!nombre || !puesto || !telefono) {
          Swal.showValidationMessage("Completa todos los campos");
          return null;
        }

        return { nombre, puesto, telefono };
      },
    });

    if (result.isConfirmed && result.value) {
      onUpdateEmpleado({ id: empleado.id, ...result.value });
      toast.fire({ icon: "success", title: "Empleado actualizado" });
    }
  };

  const filteredEmpleados = empleados.filter((empleado) => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return [empleado.nombre, empleado.puesto, empleado.telefono]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <p className="panel__title">Empleados</p>
          <p className="panel__subtitle">Listado de empleados</p>
        </div>
        <div className="panel__meta">
          <span className="badge">
            Mostrando {filteredEmpleados.length} de {empleados.length}
          </span>
        </div>
      </header>

      <div className="panel__toolbar">
        <div className="search">
          <label htmlFor="search-empleados">Buscar</label>
          <input
            id="search-empleados"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nombre, puesto o teléfono"
          />
        </div>
      </div>

      {canManage && (
        <form className="form" onSubmit={handleSubmit}>
          <div className="form__group">
            <label htmlFor="nombre">Nombre</label>
            <input
              id="nombre"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Nombre y apellido"
            />
          </div>
          <div className="form__group">
            <label htmlFor="puesto">Puesto</label>
            <input
              id="puesto"
              name="puesto"
              value={form.puesto}
              onChange={handleChange}
              placeholder="Puesto"
            />
          </div>
          <div className="form__group">
            <label htmlFor="telefono">Teléfono</label>
            <input
              id="telefono"
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              placeholder="+54 11 0000-0000"
            />
          </div>
          <button className="btn btn--primary" type="submit">
            Agregar empleado
          </button>
        </form>
      )}

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Empleado</th>
              <th>Puesto</th>
              <th>Teléfono</th>
              {(canManage || canEdit) && (
                <th className="table__actions">Acciones</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredEmpleados.map((empleado) => (
              <tr key={empleado.id}>
                <td>
                  <p className="table__primary">{empleado.nombre}</p>
                  <p className="table__secondary">{empleado.id}</p>
                </td>
                <td>{empleado.puesto}</td>
                <td>{empleado.telefono}</td>
                {(canManage || canEdit) && (
                  <td className="table__actions">
                    {canEdit && (
                      <button
                        type="button"
                        className="btn btn--ghost btn--info"
                        onClick={() => handleEdit(empleado)}
                      >
                        Editar
                      </button>
                    )}
                    {canManage && (
                      <button
                        type="button"
                        className="btn btn--ghost btn--danger"
                        onClick={() => handleDelete(empleado.id)}
                      >
                        Eliminar
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {filteredEmpleados.length === 0 && (
              <tr>
                <td colSpan={canManage || canEdit ? 4 : 3}>
                  <p className="table__empty">
                    No se encontraron empleados con ese criterio.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default EmpleadosContainer;
