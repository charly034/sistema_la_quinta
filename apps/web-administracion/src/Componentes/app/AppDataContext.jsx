/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const AppDataContext = createContext(null);

const empleadosIniciales = [
  {
    id: "EMP-001",
    nombre: "Camila Torres",
    puesto: "Analista de Nómina",
    telefono: "+54 11 3456-7890",
  },
  {
    id: "EMP-002",
    nombre: "Julián Pérez",
    puesto: "Operario de Planta",
    telefono: "+54 11 4567-1234",
  },
  {
    id: "EMP-003",
    nombre: "Lucía Gómez",
    puesto: "Supervisora",
    telefono: "+54 11 5678-2345",
  },
  {
    id: "EMP-004",
    nombre: "Matías Rivas",
    puesto: "Desarrollador",
    telefono: "+54 11 6789-3456",
  },
];

const adelantosIniciales = [
  {
    id: "AD-1001",
    empleadoId: "EMP-002",
    empleadoNombre: "Julián Pérez",
    fecha: "2026-01-21",
    tipo: "efectivo",
    monto: 55000,
    peso: 0,
    cantidad: 0,
    mercaderia: "",
    motivo: "Gastos médicos",
    estado: "Pendiente",
  },
  {
    id: "AD-1002",
    empleadoId: "EMP-001",
    empleadoNombre: "Camila Torres",
    fecha: "2026-01-11",
    tipo: "efectivo",
    monto: 75000,
    peso: 0,
    cantidad: 0,
    mercaderia: "",
    motivo: "Arreglo de vivienda",
    estado: "Aprobado",
  },
  {
    id: "AD-1003",
    empleadoId: "EMP-003",
    empleadoNombre: "Lucía Gómez",
    fecha: "2026-01-03",
    tipo: "mercaderia",
    monto: 48000,
    peso: 120,
    cantidad: 40,
    mercaderia: "Insumos",
    motivo: "Traslado familiar",
    estado: "Pagado",
  },
];

const mercaderiasIniciales = [
  "Insumos",
  "Material de limpieza",
  "Herramientas",
];

export function AppDataProvider({ children }) {
  const [empleados, setEmpleados] = useState(empleadosIniciales);
  const [adelantos, setAdelantos] = useState(adelantosIniciales);
  const [mercaderias, setMercaderias] = useState(mercaderiasIniciales);

  const addAdelanto = useCallback((nuevoAdelanto) => {
    setAdelantos((prev) => [nuevoAdelanto, ...prev]);
  }, []);

  const updateAdelanto = useCallback(
    (adelantoActualizado) => {
      setAdelantos((prev) =>
        prev.map((adelanto) => {
          if (adelanto.id !== adelantoActualizado.id) {
            return adelanto;
          }

          const updated = { ...adelanto, ...adelantoActualizado };

          if (adelantoActualizado.empleadoId) {
            const empleado = empleados.find(
              (item) => item.id === adelantoActualizado.empleadoId,
            );
            updated.empleadoNombre = empleado?.nombre ?? updated.empleadoNombre;
          }

          return updated;
        }),
      );
    },
    [empleados],
  );

  const deleteAdelanto = useCallback((adelantoId) => {
    setAdelantos((prev) =>
      prev.filter((adelanto) => adelanto.id !== adelantoId),
    );
  }, []);

  const addEmpleado = useCallback((nuevoEmpleado) => {
    setEmpleados((prev) => [nuevoEmpleado, ...prev]);
  }, []);

  const updateEmpleado = useCallback((empleadoActualizado) => {
    setEmpleados((prev) =>
      prev.map((empleado) =>
        empleado.id === empleadoActualizado.id
          ? { ...empleado, ...empleadoActualizado }
          : empleado,
      ),
    );

    if (empleadoActualizado.nombre) {
      setAdelantos((prev) =>
        prev.map((adelanto) =>
          adelanto.empleadoId === empleadoActualizado.id
            ? { ...adelanto, empleadoNombre: empleadoActualizado.nombre }
            : adelanto,
        ),
      );
    }
  }, []);

  const deleteEmpleado = useCallback((empleadoId) => {
    setEmpleados((prev) =>
      prev.filter((empleado) => empleado.id !== empleadoId),
    );
    setAdelantos((prev) =>
      prev.filter((adelanto) => adelanto.empleadoId !== empleadoId),
    );
  }, []);

  const addMercaderia = useCallback((nombre) => {
    const normalized = nombre.trim();
    if (!normalized) {
      return;
    }
    setMercaderias((prev) =>
      prev.some((item) => item.toLowerCase() === normalized.toLowerCase())
        ? prev
        : [normalized, ...prev],
    );
  }, []);

  const value = useMemo(
    () => ({
      empleados,
      adelantos,
      mercaderias,
      addAdelanto,
      updateAdelanto,
      deleteAdelanto,
      addEmpleado,
      updateEmpleado,
      deleteEmpleado,
      addMercaderia,
    }),
    [
      empleados,
      adelantos,
      mercaderias,
      addAdelanto,
      updateAdelanto,
      deleteAdelanto,
      addEmpleado,
      updateEmpleado,
      deleteEmpleado,
      addMercaderia,
    ],
  );

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData debe usarse dentro de AppDataProvider");
  }
  return context;
}
