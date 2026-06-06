import { useMemo } from "react";
import { Navigate, Outlet, Route, Routes, useNavigate } from "react-router-dom";
import "./App.css";
import Navbar from "./Componentes/Navbar/Navbar";
import EmpleadosContainer from "./Componentes/empleadoscontainer/EmpleadosContainer";
import AdelantosContainer from "./Componentes/adelantoscontainer/AdelantosContainer";
import LoginView from "./Componentes/auth/LoginView";
import { AuthProvider, useAuth } from "./Componentes/auth/AuthContext";
import { AppDataProvider, useAppData } from "./Componentes/app/AppDataContext";

function App() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <AppContent />
      </AppDataProvider>
    </AuthProvider>
  );
}

function AppContent() {
  const { usuarioActual, permisos } = useAuth();
  const {
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
  } = useAppData();

  const adelantosVisibles = useMemo(() => {
    if (!usuarioActual) {
      return [];
    }

    if (usuarioActual.rol === "admin") {
      return adelantos;
    }

    return adelantos.filter(
      (adelanto) => adelanto.empleadoId === usuarioActual.empleadoId,
    );
  }, [adelantos, usuarioActual]);

  const resumen = useMemo(() => {
    const total = adelantosVisibles.reduce(
      (acc, adelanto) => acc + adelanto.monto,
      0,
    );
    const pendientes = adelantosVisibles.filter(
      (adelanto) => adelanto.estado === "Pendiente",
    ).length;
    const empleadosConAdelanto = new Set(
      adelantosVisibles.map((adelanto) => adelanto.empleadoId),
    ).size;

    return { total, pendientes, empleadosConAdelanto };
  }, [adelantosVisibles]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={
            <DashboardPage
              resumen={resumen}
              empleados={empleados}
              adelantos={adelantosVisibles}
              mercaderias={mercaderias}
              onAddEmpleado={addEmpleado}
              onUpdateEmpleado={updateEmpleado}
              onDeleteEmpleado={deleteEmpleado}
              onAddAdelanto={addAdelanto}
              onUpdateAdelanto={updateAdelanto}
              onDeleteAdelanto={deleteAdelanto}
              onAddMercaderia={addMercaderia}
              permisos={permisos}
            />
          }
        />
        <Route
          path="/empleados"
          element={
            <EmpleadosPage
              empleados={empleados}
              permisos={permisos}
              onAddEmpleado={addEmpleado}
              onUpdateEmpleado={updateEmpleado}
              onDeleteEmpleado={deleteEmpleado}
            />
          }
        />
        <Route
          path="/adelantos"
          element={
            <AdelantosPage
              adelantos={adelantosVisibles}
              empleados={empleados}
              mercaderias={mercaderias}
              onAddAdelanto={addAdelanto}
              onUpdateAdelanto={updateAdelanto}
              onDeleteAdelanto={deleteAdelanto}
              onAddMercaderia={addMercaderia}
              permisos={permisos}
            />
          }
        />
      </Route>
      <Route
        path="*"
        element={
          <Navigate to={usuarioActual ? "/dashboard" : "/login"} replace />
        }
      />
    </Routes>
  );
}

function SummaryCard({ label, value, hint, variant }) {
  const isCurrency = label.toLowerCase().includes("total");
  const formattedValue = isCurrency
    ? new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
      }).format(value)
    : value;

  return (
    <article className={`summary-card summary-card--${variant}`}>
      <p className="summary-card__label">{label}</p>
      <p className="summary-card__value">{formattedValue}</p>
      <p className="summary-card__hint">{hint}</p>
    </article>
  );
}

export default App;

function PermissionPanel({ title, description }) {
  return (
    <section className="panel panel--empty">
      <header className="panel__header">
        <div>
          <p className="panel__title">{title}</p>
          <p className="panel__subtitle">Acceso restringido</p>
        </div>
      </header>
      <div className="panel__empty">
        <p>{description}</p>
      </div>
    </section>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const { usuarios, usuarioActual, login } = useAuth();

  if (usuarioActual) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = (usuarioId, password) => {
    const success = login(usuarioId, password);
    if (success) {
      navigate("/dashboard", { replace: true });
    }
    return success;
  };

  return (
    <div className="auth-layout">
      <LoginView usuarios={usuarios} onLogin={handleLogin} />
    </div>
  );
}

function ProtectedLayout() {
  const navigate = useNavigate();
  const { usuarioActual, permisos, logout } = useAuth();

  if (!usuarioActual) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app">
      <Navbar
        usuario={usuarioActual}
        permisos={permisos}
        onLogout={handleLogout}
      />
      <main className="app__main">
        <Outlet />
      </main>
    </div>
  );
}

function DashboardPage({
  resumen,
  empleados,
  adelantos,
  mercaderias,
  onAddEmpleado,
  onUpdateEmpleado,
  onDeleteEmpleado,
  onAddAdelanto,
  onUpdateAdelanto,
  onDeleteAdelanto,
  onAddMercaderia,
  permisos,
}) {
  return (
    <>
      <section className="summary">
        <SummaryCard
          label="Total adelantado"
          value={resumen.total}
          hint="Monto acumulado"
          variant="primary"
        />
        <SummaryCard
          label="Solicitudes pendientes"
          value={resumen.pendientes}
          hint="Por aprobar"
          variant="warning"
        />
        <SummaryCard
          label="Empleados con adelanto"
          value={resumen.empleadosConAdelanto}
          hint="Últimos 30 días"
          variant="success"
        />
      </section>

      <section className="content-grid">
        {permisos.has("view_empleados") ? (
          <EmpleadosContainer
            empleados={empleados}
            onAddEmpleado={onAddEmpleado}
            onUpdateEmpleado={onUpdateEmpleado}
            onDeleteEmpleado={onDeleteEmpleado}
            canManage={permisos.has("manage_empleados")}
            canEdit={permisos.has("update_empleado")}
          />
        ) : (
          <PermissionPanel
            title="Empleados"
            description="No tienes permisos para ver el listado de empleados."
          />
        )}
        {permisos.has("view_adelantos") ? (
          <AdelantosContainer
            adelantos={adelantos}
            empleados={empleados}
            mercaderias={mercaderias}
            onAddAdelanto={onAddAdelanto}
            onUpdateAdelanto={onUpdateAdelanto}
            onDeleteAdelanto={onDeleteAdelanto}
            onAddMercaderia={onAddMercaderia}
            canCreate={permisos.has("create_adelanto")}
            canEdit={permisos.has("update_adelanto")}
            canDelete={permisos.has("delete_adelanto")}
          />
        ) : (
          <PermissionPanel
            title="Adelantos"
            description="No tienes permisos para ver los adelantos."
          />
        )}
      </section>
    </>
  );
}

function EmpleadosPage({
  empleados,
  permisos,
  onAddEmpleado,
  onUpdateEmpleado,
  onDeleteEmpleado,
}) {
  return permisos.has("view_empleados") ? (
    <EmpleadosContainer
      empleados={empleados}
      onAddEmpleado={onAddEmpleado}
      onUpdateEmpleado={onUpdateEmpleado}
      onDeleteEmpleado={onDeleteEmpleado}
      canManage={permisos.has("manage_empleados")}
      canEdit={permisos.has("update_empleado")}
    />
  ) : (
    <PermissionPanel
      title="Empleados"
      description="No tienes permisos para ver el listado de empleados."
    />
  );
}

function AdelantosPage({
  adelantos,
  empleados,
  mercaderias,
  onAddAdelanto,
  onUpdateAdelanto,
  onDeleteAdelanto,
  onAddMercaderia,
  permisos,
}) {
  return permisos.has("view_adelantos") ? (
    <AdelantosContainer
      adelantos={adelantos}
      empleados={empleados}
      mercaderias={mercaderias}
      onAddAdelanto={onAddAdelanto}
      onUpdateAdelanto={onUpdateAdelanto}
      onDeleteAdelanto={onDeleteAdelanto}
      onAddMercaderia={onAddMercaderia}
      canCreate={permisos.has("create_adelanto")}
      canEdit={permisos.has("update_adelanto")}
      canDelete={permisos.has("delete_adelanto")}
    />
  ) : (
    <PermissionPanel
      title="Adelantos"
      description="No tienes permisos para ver los adelantos."
    />
  );
}
